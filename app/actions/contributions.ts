"use server";

import prisma from "@/app/lib/prisma";
import { requireAuth, isAdminTreasurerOrOwner } from "@/app/lib/auth-helpers";
import { getString, getOptionalString, getNumber } from "@/app/lib/form";
import { notifyContributionVerified, notifyContributionRejected } from "@/app/lib/notifications";
import { getPublicUrl } from "@/app/lib/s3-upload";
import { revalidatePath } from "next/cache";

export type ContributionItem = {
  id: string;
  amount: number;
  submittedAt: string;
  status: string;
  paymentMethod: string;
  receiptUrl: string | null;
  receiptFileType: string | null;
  receiptFileName: string | null;
  rejectionReason: string | null;
};

export async function loadMoreContributions(cursor: {
  submittedAt: string;
  id: string;
}): Promise<ContributionItem[]> {
  const session = await requireAuth();
  const userId = session.user.id;
  const cooperativeId = session.user.cooperativeId as string;

  const cursorDate = new Date(cursor.submittedAt);

  const rows = await prisma.contribution.findMany({
    where: {
      userId,
      cooperativeId,
      deletedAt: null,
      OR: [
        { submittedAt: { lt: cursorDate } },
        { submittedAt: cursorDate, id: { lt: cursor.id } },
      ],
    },
    orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
    take: 7,
  });

  return rows.map((c) => ({
    id: c.id,
    amount: Number(c.amount),
    submittedAt: c.submittedAt.toISOString(),
    status: c.status,
    paymentMethod: c.paymentMethod,
    receiptUrl: c.receiptKey ? getPublicUrl(c.receiptKey) : (c.receiptUrl ?? null),
    receiptFileType: c.receiptFileType ?? null,
    receiptFileName: c.receiptFileName ?? null,
    rejectionReason: c.rejectionReason ?? null,
  }));
}

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

  const amount = getNumber(formData, "amount");
  const paymentMethod = getString(formData, "paymentMethod");
  const receiptKey = getOptionalString(formData, "receiptKey");
  const receiptFileName = getOptionalString(formData, "receiptFileName");
  const receiptFileSizeStr = getString(formData, "receiptFileSize");
  const receiptFileType = getOptionalString(formData, "receiptFileType");
  const legacyReceiptUrl = getOptionalString(formData, "receiptUrl");

  if (isNaN(amount) || !paymentMethod) {
    return { error: "Amount and payment method are required." };
  }
  if (amount <= 0) {
    return { error: "Amount must be a positive number." };
  }

  if (!VALID_PAYMENT_METHODS.includes(paymentMethod as (typeof VALID_PAYMENT_METHODS)[number])) {
    return { error: "Invalid payment method." };
  }

  const receiptUrl = receiptKey ? getPublicUrl(receiptKey) : legacyReceiptUrl;
  const receiptFileSize = receiptFileSizeStr ? parseInt(receiptFileSizeStr, 10) || null : null;
  const receiptUploadedAt = receiptKey ? new Date() : null;

  try {
    await prisma.$transaction(async (tx) => {
      const contribution = await tx.contribution.create({
        data: {
          cooperativeId,
          userId,
          amount,
          paymentMethod: paymentMethod as (typeof VALID_PAYMENT_METHODS)[number],
          receiptUrl,
          receiptKey,
          receiptFileName,
          receiptFileSize,
          receiptFileType,
          receiptUploadedAt,
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

  if (!isAdminTreasurerOrOwner(role)) {
    return { error: "Only admins and treasurers can record contributions." };
  }

  const cooperativeId = session.user.cooperativeId as string;
  const memberId = getString(formData, "memberId");
  const amount = getNumber(formData, "amount");
  const note = getOptionalString(formData, "note");

  if (!memberId) {
    return { error: "Member and amount are required." };
  }
  if (memberId === session.user.id) {
    return { error: "You cannot record a contribution for yourself. Submit it as a member instead." };
  }
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
          data: { contributionId: contribution.id, memberId, amount, note },
        },
      });
    });
  } catch {
    return { error: "Failed to record contribution. Please try again." };
  }

  // Notify member their contribution was recorded (non-blocking)
  notifyContributionVerified(memberId, cooperativeId, amount).catch(() => {});

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

  if (!isAdminTreasurerOrOwner(role)) {
    return { error: "Only admins and treasurers can verify contributions." };
  }

  const cooperativeId = session.user.cooperativeId as string;
  const contributionId = getString(formData, "contributionId");
  const decision = getString(formData, "decision");
  const rejectionReason = getOptionalString(formData, "rejectionReason");

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
    select: { status: true, cooperativeId: true, userId: true, amount: true },
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
            rejectionReason,
          },
        },
      });
    });
  } catch {
    return { error: "Failed to record decision. Please try again." };
  }

  // Notify member (non-blocking)
  if (decision === "VERIFIED") {
    notifyContributionVerified(contribution.userId, cooperativeId, Number(contribution.amount)).catch(() => {});
  } else {
    notifyContributionRejected(contribution.userId, cooperativeId, Number(contribution.amount), rejectionReason!).catch(() => {});
  }

  revalidatePath("/dashboard/contributions");
  revalidatePath("/admin/contributions");
  return { success: true };
}
