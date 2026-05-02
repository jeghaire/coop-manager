"use server";

import prisma from "@/app/lib/prisma";
import { requireAuth } from "@/app/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import {
  notifyWithdrawalApproved,
  notifyWithdrawalRejected,
  notifyWithdrawalPaid,
} from "@/app/lib/notifications";

export type WithdrawalActionState = {
  error?: string;
  success?: boolean;
};

const VALID_REASONS = ["PERSONAL", "EMERGENCY", "LEAVING", "OTHER"] as const;

export async function getAvailableWithdrawal(
  userId: string,
  cooperativeId: string
): Promise<number> {
  const contributions = await prisma.contribution.aggregate({
    where: { userId, cooperativeId, status: "VERIFIED", deletedAt: null },
    _sum: { amount: true },
  });
  const totalContributed = Number(contributions._sum.amount ?? 0);

  const activeLoan = await prisma.loanApplication.findFirst({
    where: {
      userId,
      cooperativeId,
      status: "APPROVED",
      repaidAt: null,
      deletedAt: null,
    },
    include: { repayments: true },
  });

  let activeBalance = 0;
  if (activeLoan) {
    const totalRepaid = activeLoan.repayments.reduce(
      (sum, r) => sum + Number(r.amount),
      0
    );
    activeBalance = Number(activeLoan.totalAmountDue) - totalRepaid;
  }

  return Math.max(0, totalContributed - activeBalance);
}

export async function requestWithdrawal(
  _prev: WithdrawalActionState,
  formData: FormData
): Promise<WithdrawalActionState> {
  const session = await requireAuth();
  const userId = session.user.id;
  const cooperativeId = session.user.cooperativeId as string;

  const amountStr = (formData.get("amount") as string)?.trim();
  const reason = (formData.get("reason") as string)?.trim();
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!amountStr || !reason) {
    return { error: "Amount and reason are required." };
  }

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    return { error: "Amount must be a positive number." };
  }

  if (!VALID_REASONS.includes(reason as (typeof VALID_REASONS)[number])) {
    return { error: "Invalid reason selected." };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { verifiedAt: true },
  });

  if (!user?.verifiedAt) {
    return { error: "Your account must be verified before requesting a withdrawal." };
  }

  const available = await getAvailableWithdrawal(userId, cooperativeId);
  if (amount > available) {
    return {
      error: `Amount cannot exceed your available balance of ₦${available.toLocaleString()}.`,
    };
  }

  const pending = await prisma.withdrawalRequest.findFirst({
    where: { userId, cooperativeId, status: "REQUESTED", deletedAt: null },
    select: { id: true },
  });
  if (pending) {
    return { error: "You already have a pending withdrawal request." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const withdrawal = await tx.withdrawalRequest.create({
        data: { userId, cooperativeId, amount, reason, notes, status: "REQUESTED" },
      });

      await tx.event.create({
        data: {
          cooperativeId,
          eventType: "withdrawal_requested",
          actorId: userId,
          actorType: "user",
          entityType: "withdrawal",
          data: { withdrawalId: withdrawal.id, amount, reason },
        },
      });
    });
  } catch {
    return { error: "Failed to submit withdrawal request. Please try again." };
  }

  revalidatePath("/dashboard/withdrawals");
  revalidatePath("/admin/withdrawals");
  return { success: true };
}

export async function approveWithdrawal(
  _prev: WithdrawalActionState,
  formData: FormData
): Promise<WithdrawalActionState> {
  const session = await requireAuth();
  const role = session.user.role as string;

  if (role !== "ADMIN" && role !== "OWNER") {
    return { error: "Only admins can approve withdrawals." };
  }

  const cooperativeId = session.user.cooperativeId as string;
  const withdrawalId = (formData.get("withdrawalId") as string)?.trim();

  if (!withdrawalId) return { error: "Missing withdrawal ID." };

  const withdrawal = await prisma.withdrawalRequest.findUnique({
    where: { id: withdrawalId },
    select: { status: true, cooperativeId: true, userId: true, amount: true },
  });

  if (!withdrawal || withdrawal.cooperativeId !== cooperativeId) {
    return { error: "Withdrawal not found." };
  }

  if (withdrawal.status !== "REQUESTED") {
    return { error: "Can only approve pending withdrawals." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: { status: "APPROVED", approvedAt: new Date(), approvedBy: session.user.id },
      });

      await tx.event.create({
        data: {
          cooperativeId,
          eventType: "withdrawal_approved",
          actorId: session.user.id,
          actorType: "admin",
          entityType: "withdrawal",
          data: { withdrawalId, amount: withdrawal.amount },
        },
      });
    });
  } catch {
    return { error: "Failed to approve withdrawal. Please try again." };
  }

  notifyWithdrawalApproved(withdrawal.userId, cooperativeId, Number(withdrawal.amount)).catch(() => {});

  revalidatePath("/admin/withdrawals");
  revalidatePath("/dashboard/withdrawals");
  return { success: true };
}

export async function rejectWithdrawal(
  _prev: WithdrawalActionState,
  formData: FormData
): Promise<WithdrawalActionState> {
  const session = await requireAuth();
  const role = session.user.role as string;

  if (role !== "ADMIN" && role !== "OWNER") {
    return { error: "Only admins can reject withdrawals." };
  }

  const cooperativeId = session.user.cooperativeId as string;
  const withdrawalId = (formData.get("withdrawalId") as string)?.trim();
  const rejectionReason = (formData.get("rejectionReason") as string)?.trim();

  if (!withdrawalId) return { error: "Missing withdrawal ID." };
  if (!rejectionReason) return { error: "Rejection reason is required." };

  const withdrawal = await prisma.withdrawalRequest.findUnique({
    where: { id: withdrawalId },
    select: { status: true, cooperativeId: true, userId: true, amount: true },
  });

  if (!withdrawal || withdrawal.cooperativeId !== cooperativeId) {
    return { error: "Withdrawal not found." };
  }

  if (withdrawal.status !== "REQUESTED") {
    return { error: "Can only reject pending withdrawals." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: { status: "REJECTED", rejectionReason },
      });

      await tx.event.create({
        data: {
          cooperativeId,
          eventType: "withdrawal_rejected",
          actorId: session.user.id,
          actorType: "admin",
          entityType: "withdrawal",
          data: { withdrawalId, amount: withdrawal.amount, reason: rejectionReason },
        },
      });
    });
  } catch {
    return { error: "Failed to reject withdrawal. Please try again." };
  }

  notifyWithdrawalRejected(withdrawal.userId, cooperativeId, Number(withdrawal.amount), rejectionReason).catch(() => {});

  revalidatePath("/admin/withdrawals");
  revalidatePath("/dashboard/withdrawals");
  return { success: true };
}

export async function markWithdrawalPaid(
  _prev: WithdrawalActionState,
  formData: FormData
): Promise<WithdrawalActionState> {
  const session = await requireAuth();
  const role = session.user.role as string;

  if (role !== "ADMIN" && role !== "OWNER") {
    return { error: "Only admins can mark withdrawals as paid." };
  }

  const cooperativeId = session.user.cooperativeId as string;
  const withdrawalId = (formData.get("withdrawalId") as string)?.trim();

  if (!withdrawalId) return { error: "Missing withdrawal ID." };

  const withdrawal = await prisma.withdrawalRequest.findUnique({
    where: { id: withdrawalId },
    select: { status: true, cooperativeId: true, userId: true, amount: true },
  });

  if (!withdrawal || withdrawal.cooperativeId !== cooperativeId) {
    return { error: "Withdrawal not found." };
  }

  if (withdrawal.status !== "APPROVED") {
    return { error: "Can only mark approved withdrawals as paid." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: { status: "PAID", paidAt: new Date() },
      });

      await tx.event.create({
        data: {
          cooperativeId,
          eventType: "withdrawal_paid",
          actorId: session.user.id,
          actorType: "admin",
          entityType: "withdrawal",
          data: { withdrawalId, amount: withdrawal.amount },
        },
      });
    });
  } catch {
    return { error: "Failed to mark withdrawal as paid. Please try again." };
  }

  notifyWithdrawalPaid(withdrawal.userId, cooperativeId, Number(withdrawal.amount)).catch(() => {});

  revalidatePath("/admin/withdrawals");
  revalidatePath("/dashboard/withdrawals");
  return { success: true };
}

export async function getMemberWithdrawals(cooperativeId: string) {
  const session = await requireAuth();
  return prisma.withdrawalRequest.findMany({
    where: { userId: session.user.id, cooperativeId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllWithdrawals(cooperativeId: string, status?: string) {
  const session = await requireAuth();
  const role = session.user.role as string;

  if (role !== "ADMIN" && role !== "OWNER") {
    throw new Error("Unauthorized");
  }

  return prisma.withdrawalRequest.findMany({
    where: {
      cooperativeId,
      ...(status ? { status } : {}),
      deletedAt: null,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
