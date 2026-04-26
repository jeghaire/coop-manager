"use server";

import prisma from "@/app/lib/prisma";
import { requireAuth, requireCooperativeAccess } from "@/app/lib/auth-helpers";
import { revalidatePath } from "next/cache";

export type LoanActionState = {
  error?: string;
  success?: boolean;
};

export async function applyForLoan(
  _prev: LoanActionState,
  formData: FormData
): Promise<LoanActionState> {
  const session = await requireAuth();
  const userId = session.user.id;
  const cooperativeId = session.user.cooperativeId as string;

  const amountStr = (formData.get("amount") as string)?.trim();
  const guarantor1Id = (formData.get("guarantor1Id") as string)?.trim();
  const guarantor2Id = (formData.get("guarantor2Id") as string)?.trim();
  const purposeText = (formData.get("purpose") as string)?.trim();

  if (!amountStr || !guarantor1Id || !guarantor2Id) {
    return { error: "Amount and two guarantors are required." };
  }

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    return { error: "Amount must be a positive number." };
  }

  if (guarantor1Id === guarantor2Id) {
    return { error: "The two guarantors must be different people." };
  }

  if (guarantor1Id === userId || guarantor2Id === userId) {
    return { error: "You cannot be your own guarantor." };
  }

  // Validate guarantors exist, belong to same cooperative, are not deleted, not admin/owner
  const guarantors = await prisma.user.findMany({
    where: {
      id: { in: [guarantor1Id, guarantor2Id] },
      cooperativeId,
      deletedAt: null,
      role: { notIn: ["ADMIN", "OWNER"] },
    },
    select: { id: true, name: true },
  });

  if (guarantors.length !== 2) {
    return {
      error:
        "One or both guarantors are invalid. Guarantors must be active members of your cooperative and cannot be admins.",
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const loan = await tx.loanApplication.create({
        data: {
          cooperativeId,
          userId,
          amountRequested: amount,
          status: "PENDING_GUARANTORS",
        },
      });

      await tx.loanGuarantor.createMany({
        data: [
          { loanId: loan.id, guarantorId: guarantor1Id },
          { loanId: loan.id, guarantorId: guarantor2Id },
        ],
      });

      await tx.event.create({
        data: {
          cooperativeId,
          eventType: "loan_application_submitted",
          actorId: userId,
          actorType: "user",
          entityType: "loan",
          data: {
            loanId: loan.id,
            amount,
            purpose: purposeText || null,
            guarantorIds: [guarantor1Id, guarantor2Id],
          },
        },
      });
    });
  } catch {
    return { error: "Failed to submit loan application. Please try again." };
  }

  revalidatePath("/dashboard/loans");
  return { success: true };
}

export async function respondAsGuarantor(
  _prev: LoanActionState,
  formData: FormData
): Promise<LoanActionState> {
  const session = await requireAuth();
  const userId = session.user.id;
  const cooperativeId = session.user.cooperativeId as string;

  const loanId = (formData.get("loanId") as string)?.trim();
  const response = formData.get("response") as string;
  const rejectionReason = (formData.get("rejectionReason") as string)?.trim();

  if (!loanId || !response) {
    return { error: "Missing required fields." };
  }

  if (response !== "ACCEPTED" && response !== "REJECTED") {
    return { error: "Invalid response." };
  }

  if (response === "REJECTED" && !rejectionReason) {
    return { error: "Please provide a reason for rejection." };
  }

  // Find the guarantor record
  const guarantorRecord = await prisma.loanGuarantor.findFirst({
    where: { loanId, guarantorId: userId, deletedAt: null },
    include: {
      loan: { select: { status: true, cooperativeId: true } },
    },
  });

  if (!guarantorRecord) {
    return { error: "You are not a guarantor on this loan." };
  }

  if (guarantorRecord.loan.cooperativeId !== cooperativeId) {
    return { error: "Access denied." };
  }

  if (guarantorRecord.status !== "PENDING") {
    return { error: "You have already responded to this loan request." };
  }

  if (guarantorRecord.loan.status !== "PENDING_GUARANTORS") {
    return { error: "This loan is no longer awaiting guarantor responses." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.loanGuarantor.update({
        where: { id: guarantorRecord.id },
        data: {
          status: response,
          acceptedAt: response === "ACCEPTED" ? new Date() : null,
          rejectionReason: response === "REJECTED" ? rejectionReason : null,
        },
      });

      await tx.event.create({
        data: {
          cooperativeId,
          eventType:
            response === "ACCEPTED" ? "guarantor_accepted" : "guarantor_rejected",
          actorId: userId,
          actorType: "user",
          entityType: "loan",
          data: {
            loanId,
            guarantorId: userId,
            rejectionReason: rejectionReason || null,
          },
        },
      });

      // Check if we need to update loan status
      if (response === "REJECTED") {
        // Auto-reject the loan
        await tx.loanApplication.update({
          where: { id: loanId },
          data: {
            status: "REJECTED",
            rejectionReason: `Guarantor rejected: ${rejectionReason}`,
          },
        });

        await tx.event.create({
          data: {
            cooperativeId,
            eventType: "loan_auto_rejected",
            actorId: userId,
            actorType: "user",
            entityType: "loan",
            data: { loanId, reason: "Guarantor rejected the request" },
          },
        });
      } else {
        // Check if all guarantors have accepted
        const pendingGuarantors = await tx.loanGuarantor.count({
          where: { loanId, status: "PENDING", deletedAt: null },
        });

        if (pendingGuarantors === 0) {
          await tx.loanApplication.update({
            where: { id: loanId },
            data: { status: "PENDING_ADMIN_REVIEW" },
          });

          await tx.event.create({
            data: {
              cooperativeId,
              eventType: "loan_ready_for_review",
              actorId: userId,
              actorType: "system",
              entityType: "loan",
              data: { loanId },
            },
          });
        }
      }
    });
  } catch {
    return { error: "Failed to submit response. Please try again." };
  }

  revalidatePath("/dashboard/loans");
  return { success: true };
}

export async function reviewLoan(
  _prev: LoanActionState,
  formData: FormData
): Promise<LoanActionState> {
  const session = await requireAuth();
  const role = session.user.role as string;

  if (role !== "ADMIN" && role !== "OWNER") {
    return { error: "Only admins can review loans." };
  }

  const cooperativeId = session.user.cooperativeId as string;
  const loanId = (formData.get("loanId") as string)?.trim();
  const decision = formData.get("decision") as string;
  const reason = (formData.get("reason") as string)?.trim();

  if (!loanId || !decision) {
    return { error: "Missing required fields." };
  }

  if (decision !== "APPROVED" && decision !== "REJECTED") {
    return { error: "Invalid decision." };
  }

  if (decision === "REJECTED" && !reason) {
    return { error: "Please provide a reason for rejection." };
  }

  const loan = await prisma.loanApplication.findUnique({
    where: { id: loanId },
    select: { status: true, cooperativeId: true },
  });

  if (!loan || loan.cooperativeId !== cooperativeId) {
    return { error: "Loan not found." };
  }

  if (loan.status !== "PENDING_ADMIN_REVIEW") {
    return { error: "This loan is not awaiting admin review." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.loanApplication.update({
        where: { id: loanId },
        data: {
          status: decision,
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
          rejectionReason: decision === "REJECTED" ? reason : null,
        },
      });

      await tx.event.create({
        data: {
          cooperativeId,
          eventType:
            decision === "APPROVED"
              ? "loan_application_approved"
              : "loan_application_rejected",
          actorId: session.user.id,
          actorType: "admin",
          entityType: "loan",
          data: {
            loanId,
            decision,
            reason: reason || null,
          },
        },
      });
    });
  } catch {
    return { error: "Failed to record decision. Please try again." };
  }

  revalidatePath("/dashboard/loans");
  revalidatePath("/admin/loans");
  return { success: true };
}
