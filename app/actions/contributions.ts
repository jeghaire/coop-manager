"use server";

import prisma from "@/app/lib/prisma";
import { requireAuth } from "@/app/lib/auth-helpers";
import { revalidatePath } from "next/cache";

export type ContributionActionState = {
  error?: string;
  success?: boolean;
};

const VALID_PAYMENT_METHODS = ["BANK_TRANSFER", "MOBILE_MONEY", "CASH"] as const;

export async function submitContribution(
  _prev: ContributionActionState,
  formData: FormData
): Promise<ContributionActionState> {
  const session = await requireAuth();
  const userId = session.user.id;
  const cooperativeId = session.user.cooperativeId as string;

  const amountStr = (formData.get("amount") as string)?.trim();
  const paymentMethod = (formData.get("paymentMethod") as string)?.trim();
  const receiptUrl = (formData.get("receiptUrl") as string)?.trim() || null;

  if (!amountStr || !paymentMethod) {
    return { error: "Amount and payment method are required." };
  }

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    return { error: "Amount must be a positive number." };
  }

  if (!VALID_PAYMENT_METHODS.includes(paymentMethod as (typeof VALID_PAYMENT_METHODS)[number])) {
    return { error: "Invalid payment method." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const contribution = await tx.contribution.create({
        data: {
          cooperativeId,
          userId,
          amount,
          paymentMethod: paymentMethod as (typeof VALID_PAYMENT_METHODS)[number],
          receiptUrl,
          status: "PENDING_VERIFICATION",
          submittedAt: new Date(),
        },
      });

      await tx.event.create({
        data: {
          cooperativeId,
          eventType: "contribution_submitted",
          actorId: userId,
          actorType: "user",
          entityType: "contribution",
          data: {
            contributionId: contribution.id,
            amount,
            paymentMethod,
            receiptUrl: receiptUrl || null,
          },
        },
      });
    });
  } catch {
    return { error: "Failed to submit contribution. Please try again." };
  }

  revalidatePath("/dashboard/contributions");
  return { success: true };
}

export async function recordContributionForMember(
  _prev: ContributionActionState,
  formData: FormData
): Promise<ContributionActionState> {
  const session = await requireAuth();
  const role = session.user.role as string;

  if (role !== "ADMIN" && role !== "OWNER" && role !== "TREASURER") {
    return { error: "Only admins and treasurers can record contributions." };
  }

  const cooperativeId = session.user.cooperativeId as string;
  const memberId = (formData.get("memberId") as string)?.trim();
  const amountStr = (formData.get("amount") as string)?.trim();
  const note = (formData.get("note") as string)?.trim();

  if (!memberId || !amountStr) {
    return { error: "Member and amount are required." };
  }

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    return { error: "Amount must be a positive number." };
  }

  const member = await prisma.user.findUnique({
    where: { id: memberId },
    select: { id: true, cooperativeId: true, deletedAt: true },
  });

  if (!member || member.cooperativeId !== cooperativeId || member.deletedAt) {
    return { error: "Member not found." };
  }

  try {
    const now = new Date();
    await prisma.$transaction(async (tx) => {
      const contribution = await tx.contribution.create({
        data: {
          cooperativeId,
          userId: memberId,
          amount,
          paymentMethod: "DIRECT_PAYMENT",
          status: "VERIFIED",
          submittedAt: now,
          verifiedAt: now,
          verifiedByUserId: session.user.id,
        },
      });

      await tx.event.create({
        data: {
          cooperativeId,
          eventType: "contribution_recorded_by_treasurer",
          actorId: session.user.id,
          actorType: role.toLowerCase(),
          entityType: "contribution",
          data: { contributionId: contribution.id, memberId, amount, note: note || null },
        },
      });
    });
  } catch {
    return { error: "Failed to record contribution. Please try again." };
  }

  revalidatePath("/dashboard/contributions");
  revalidatePath("/admin/contributions");
  revalidatePath("/admin/treasurer");
  return { success: true };
}

export async function verifyContribution(
  _prev: ContributionActionState,
  formData: FormData
): Promise<ContributionActionState> {
  const session = await requireAuth();
  const role = session.user.role as string;

  if (role !== "ADMIN" && role !== "OWNER" && role !== "TREASURER") {
    return { error: "Only admins and treasurers can verify contributions." };
  }

  const cooperativeId = session.user.cooperativeId as string;
  const contributionId = (formData.get("contributionId") as string)?.trim();
  const decision = formData.get("decision") as string;
  const rejectionReason = (formData.get("rejectionReason") as string)?.trim();

  if (!contributionId || !decision) {
    return { error: "Missing required fields." };
  }

  if (decision !== "VERIFIED" && decision !== "REJECTED") {
    return { error: "Invalid decision." };
  }

  if (decision === "REJECTED" && !rejectionReason) {
    return { error: "Please provide a reason for rejection." };
  }

  const contribution = await prisma.contribution.findUnique({
    where: { id: contributionId },
    select: { status: true, cooperativeId: true, userId: true },
  });

  if (!contribution || contribution.cooperativeId !== cooperativeId) {
    return { error: "Contribution not found." };
  }

  if (contribution.userId === session.user.id) {
    return { error: "You cannot verify your own contribution." };
  }

  if (contribution.status !== "PENDING_VERIFICATION") {
    return { error: "This contribution has already been reviewed." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.contribution.update({
        where: { id: contributionId },
        data: {
          status: decision,
          verifiedByUserId: session.user.id,
          verifiedAt: new Date(),
          rejectionReason: decision === "REJECTED" ? rejectionReason : null,
        },
      });

      await tx.event.create({
        data: {
          cooperativeId,
          eventType:
            decision === "VERIFIED"
              ? "contribution_verified"
              : "contribution_rejected",
          actorId: session.user.id,
          actorType: "admin",
          entityType: "contribution",
          data: {
            contributionId,
            decision,
            rejectionReason: rejectionReason || null,
          },
        },
      });
    });
  } catch {
    return { error: "Failed to record decision. Please try again." };
  }

  revalidatePath("/dashboard/contributions");
  revalidatePath("/admin/contributions");
  return { success: true };
}
