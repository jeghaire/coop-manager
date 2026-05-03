"use server";

import prisma from "@/app/lib/prisma";
import { requireAuth, protectVerifiedAction, protectAdminAction, getTotalContributed } from "@/app/lib/auth-helpers";
import { calculateLoanTotals } from "@/app/lib/loan-helpers";
import { notifyLoanApproved, notifyLoanRejected, notifyGuarantorRequested } from "@/app/lib/notifications";
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

  // Verify user is verified (members only — admins/owners are exempt)
  const role = session.user.role as string;
  if (role === "MEMBER") {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { verifiedAt: true },
    });
    if (!dbUser?.verifiedAt) {
      return { error: "Your account must be verified before applying for a loan." };
    }
  }

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

  // Check user's contribution total
  const totalContributed = await getTotalContributed(userId);
  if (totalContributed === 0) {
    return { error: "You must have at least one verified contribution to apply for a loan." };
  }

  // Fetch cooperative settings for borrowing capacity and guarantor mode
  const cooperative = await prisma.cooperative.findUnique({
    where: { id: cooperativeId },
    select: { borrowingMultiplier: true, guarantorCoverageMode: true },
  });

  if (!cooperative) return { error: "Cooperative not found." };

  const borrowingCapacity = totalContributed * cooperative.borrowingMultiplier;
  if (amount > borrowingCapacity) {
    return {
      error: `Loan amount exceeds your borrowing capacity of ₦${borrowingCapacity.toLocaleString()} (${cooperative.borrowingMultiplier}× your contributions).`,
    };
  }

  // Validate guarantors exist, belong to same cooperative, not deleted, not admin/owner
  const guarantors = await prisma.user.findMany({
    where: {
      id: { in: [guarantor1Id, guarantor2Id] },
      cooperativeId,
      deletedAt: null,
      role: { notIn: ["ADMIN", "OWNER"] },
    },
    select: { id: true, name: true, verifiedAt: true },
  });

  if (guarantors.length !== 2) {
    return {
      error: "One or both guarantors are invalid. Guarantors must be active members of your cooperative and cannot be admins.",
    };
  }

  // Validate guarantors are verified
  const unverifiedGuarantor = guarantors.find((g) => !g.verifiedAt);
  if (unverifiedGuarantor) {
    return { error: `${unverifiedGuarantor.name} is not verified and cannot act as a guarantor.` };
  }

  // Validate guarantor coverage based on cooperative mode
  if (cooperative.guarantorCoverageMode !== "OFF") {
    const [g1Total, g2Total] = await Promise.all([
      getTotalContributed(guarantor1Id),
      getTotalContributed(guarantor2Id),
    ]);

    if (cooperative.guarantorCoverageMode === "COMBINED") {
      const combined = g1Total + g2Total;
      if (combined < amount) {
        return {
          error: `Guarantors' combined contributions (₦${combined.toLocaleString()}) must cover the loan amount (₦${amount.toLocaleString()}).`,
        };
      }
    } else if (cooperative.guarantorCoverageMode === "INDIVIDUAL") {
      const g1 = guarantors.find((g) => g.id === guarantor1Id)!;
      const g2 = guarantors.find((g) => g.id === guarantor2Id)!;
      if (g1Total < amount) {
        return { error: `${g1.name}'s contributions (₦${g1Total.toLocaleString()}) must individually cover the loan amount (₦${amount.toLocaleString()}).` };
      }
      if (g2Total < amount) {
        return { error: `${g2.name}'s contributions (₦${g2Total.toLocaleString()}) must individually cover the loan amount (₦${amount.toLocaleString()}).` };
      }
    }
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
            userContribution: totalContributed,
            borrowingCapacity,
            guarantorCoverageMode: cooperative.guarantorCoverageMode,
          },
        },
      });
    });
  } catch {
    return { error: "Failed to submit loan application. Please try again." };
  }

  // Notify guarantors (non-blocking)
  for (const guarantorId of [guarantor1Id, guarantor2Id]) {
    notifyGuarantorRequested(guarantorId, cooperativeId, session.user.name, amount).catch(() => {});
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
          eventType: response === "ACCEPTED" ? "guarantor_accepted" : "guarantor_rejected",
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

      if (response === "REJECTED") {
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
    select: { status: true, cooperativeId: true, amountRequested: true, userId: true },
  });

  if (!loan || loan.cooperativeId !== cooperativeId) {
    return { error: "Loan not found." };
  }

  if (loan.status !== "PENDING_ADMIN_REVIEW") {
    return { error: "This loan is not awaiting admin review." };
  }

  if (loan.userId === session.user.id) {
    return { error: "You cannot approve your own loan application." };
  }

  // If approving, calculate interest-based totals from cooperative settings
  let approvedTotalDue = 0;
  let approvedMonths = 0;
  let approvalData: Record<string, unknown> = {};
  if (decision === "APPROVED") {
    const cooperative = await prisma.cooperative.findUnique({
      where: { id: cooperativeId },
      select: { loanInterestRate: true, loanRepaymentMonths: true },
    });
    if (cooperative) {
      const { totalDue } = calculateLoanTotals(
        Number(loan.amountRequested),
        Number(cooperative.loanInterestRate)
      );
      approvedTotalDue = totalDue;
      approvedMonths = cooperative.loanRepaymentMonths;
      approvalData = {
        interestRate: cooperative.loanInterestRate,
        repaymentMonths: cooperative.loanRepaymentMonths,
        totalAmountDue: totalDue,
        approvedAt: new Date(),
      };
    }
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
          ...approvalData,
        },
      });

      await tx.event.create({
        data: {
          cooperativeId,
          eventType: decision === "APPROVED" ? "loan_application_approved" : "loan_application_rejected",
          actorId: session.user.id,
          actorType: "admin",
          entityType: "loan",
          data: {
            loanId,
            decision,
            reason: reason || null,
            amount: loan.amountRequested,
          },
        },
      });
    });
  } catch {
    return { error: "Failed to record decision. Please try again." };
  }

  // Notify member of decision (non-blocking)
  if (decision === "APPROVED" && approvedTotalDue > 0) {
    notifyLoanApproved(
      loan.userId, cooperativeId,
      Number(loan.amountRequested),
      approvedTotalDue,
      approvedMonths
    ).catch(() => {});
  } else if (decision === "REJECTED") {
    notifyLoanRejected(loan.userId, cooperativeId, Number(loan.amountRequested), reason!).catch(() => {});
  }

  revalidatePath("/dashboard/loans");
  revalidatePath("/admin/loans");
  revalidatePath("/admin/notifications");
  return { success: true };
}

export async function repayLoan(
  _prev: LoanActionState,
  formData: FormData
): Promise<LoanActionState> {
  const session = await requireAuth();
  const userId = session.user.id;
  const cooperativeId = session.user.cooperativeId as string;

  const loanId = (formData.get("loanId") as string)?.trim();
  const loanAmountStr = (formData.get("loanAmount") as string)?.trim();
  const contributionAmountStr = (formData.get("contributionAmount") as string)?.trim();

  if (!loanId) return { error: "Missing loan ID." };

  const loanAmount = parseFloat(loanAmountStr || "0");
  const contributionAmount = parseFloat(contributionAmountStr || "0");

  if (loanAmount < 0 || contributionAmount < 0) {
    return { error: "Amounts cannot be negative." };
  }

  if (loanAmount === 0 && contributionAmount === 0) {
    return { error: "Enter at least one payment amount." };
  }

  const loan = await prisma.loanApplication.findUnique({
    where: { id: loanId },
    include: {
      repayments: { select: { amount: true } },
    },
  });

  if (!loan || loan.cooperativeId !== cooperativeId) {
    return { error: "Loan not found." };
  }

  if (loan.userId !== userId) {
    return { error: "Can only repay your own loans." };
  }

  if (loan.status !== "APPROVED") {
    return { error: "This loan is not currently active." };
  }

  const totalDue = Number(loan.totalAmountDue ?? loan.amountRequested);
  const totalPaid = loan.repayments.reduce((s, r) => s + Number(r.amount), 0);
  const remaining = totalDue - totalPaid;

  if (loanAmount > remaining + 0.01) {
    return { error: `Payment of ₦${loanAmount.toLocaleString()} exceeds remaining balance of ₦${remaining.toLocaleString()}.` };
  }

  try {
    const now = new Date();
    await prisma.$transaction(async (tx) => {
      if (loanAmount > 0) {
        await tx.loanRepayment.create({
          data: {
            loanId,
            amount: loanAmount,
            paymentType: "LOAN_REPAYMENT",
            paidAt: now,
          },
        });

        // Mark repaid if balance cleared
        const newTotalPaid = totalPaid + loanAmount;
        if (newTotalPaid >= totalDue - 0.01) {
          await tx.loanApplication.update({
            where: { id: loanId },
            data: { status: "REPAID", repaidAt: now },
          });
        }
      }

      if (contributionAmount > 0) {
        await tx.contribution.create({
          data: {
            cooperativeId,
            userId,
            amount: contributionAmount,
            status: "VERIFIED",
            paymentMethod: "DIRECT_PAYMENT",
            verifiedAt: now,
            verifiedByUserId: userId,
          },
        });
      }

      await tx.event.create({
        data: {
          cooperativeId,
          eventType: "loan_repayment_made",
          actorId: userId,
          actorType: "user",
          entityType: "loan",
          data: { loanId, loanAmount, contributionAmount },
        },
      });
    });
  } catch {
    return { error: "Failed to record payment. Please try again." };
  }

  revalidatePath(`/dashboard/loans/${loanId}`);
  revalidatePath("/dashboard/loans");
  return { success: true };
}

export async function recordRepaymentForMember(
  _prev: LoanActionState,
  formData: FormData
): Promise<LoanActionState> {
  const session = await requireAuth();
  const role = session.user.role as string;

  if (role !== "ADMIN" && role !== "OWNER" && role !== "TREASURER") {
    return { error: "Only admins and treasurers can record repayments." };
  }

  const cooperativeId = session.user.cooperativeId as string;
  const loanId = (formData.get("loanId") as string)?.trim();
  const amountStr = (formData.get("amount") as string)?.trim();
  const note = (formData.get("note") as string)?.trim();

  if (!loanId || !amountStr) return { error: "Missing required fields." };

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) return { error: "Invalid amount." };

  const loan = await prisma.loanApplication.findUnique({
    where: { id: loanId },
    include: { repayments: { select: { amount: true } } },
  });

  if (!loan || loan.cooperativeId !== cooperativeId) {
    return { error: "Loan not found." };
  }

  if (loan.status !== "APPROVED") {
    return { error: "This loan is not currently active." };
  }

  if (loan.userId === session.user.id) {
    return { error: "You cannot record a repayment for your own loan. Use the member repayment form instead." };
  }

  const totalDue = Number(loan.totalAmountDue ?? loan.amountRequested);
  const totalPaid = loan.repayments.reduce((s, r) => s + Number(r.amount), 0);
  const remaining = totalDue - totalPaid;

  if (amount > remaining + 0.01) {
    return { error: `Amount exceeds remaining balance of ₦${remaining.toLocaleString()}.` };
  }

  try {
    const now = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.loanRepayment.create({
        data: {
          loanId,
          amount,
          paymentType: "LOAN_REPAYMENT",
          paidAt: now,
          recordedBy: session.user.id,
          note: note || null,
        },
      });

      const newTotalPaid = totalPaid + amount;
      if (newTotalPaid >= totalDue - 0.01) {
        await tx.loanApplication.update({
          where: { id: loanId },
          data: { status: "REPAID", repaidAt: now },
        });
      }

      await tx.event.create({
        data: {
          cooperativeId,
          eventType: "loan_repayment_recorded",
          actorId: session.user.id,
          actorType: role.toLowerCase(),
          entityType: "loan",
          data: { loanId, amount, recordedBy: session.user.id, note },
        },
      });
    });
  } catch {
    return { error: "Failed to record repayment." };
  }

  revalidatePath(`/dashboard/loans/${loanId}`);
  revalidatePath("/admin/loans");
  return { success: true };
}
