"use server";

import prisma from "@/app/lib/prisma";
import { protectAdminAction } from "@/app/lib/auth-helpers";
import { notifyDividendPaid } from "@/app/lib/notifications";
import { revalidatePath } from "next/cache";

export type DividendActionState = { error?: string; success?: boolean };

export async function createDividendPayout(
  _prev: DividendActionState,
  formData: FormData
): Promise<DividendActionState> {
  const cooperativeId = (formData.get("cooperativeId") as string)?.trim();
  if (!cooperativeId) return { error: "Missing cooperative ID." };

  const session = await protectAdminAction(cooperativeId);

  const period = (formData.get("period") as string)?.trim();
  const yearStr = (formData.get("year") as string)?.trim();
  const totalProfitStr = (formData.get("totalProfit") as string)?.trim();
  const adminCostsPctStr = (formData.get("adminCostsPct") as string)?.trim();
  const loanLossReservePctStr = (formData.get("loanLossReservePct") as string)?.trim();

  const validPeriods = ["Q1", "Q2", "Q3", "Q4", "ANNUAL"];
  if (!validPeriods.includes(period)) return { error: "Invalid period." };

  const year = parseInt(yearStr);
  const totalProfit = parseFloat(totalProfitStr);
  const adminCostsPct = parseFloat(adminCostsPctStr);
  const loanLossReservePct = parseFloat(loanLossReservePctStr);

  if (isNaN(year) || year < 2000 || year > 2100) return { error: "Invalid year." };
  if (isNaN(totalProfit) || totalProfit <= 0) return { error: "Total profit must be positive." };
  if (isNaN(adminCostsPct) || adminCostsPct < 0 || adminCostsPct > 100)
    return { error: "Invalid admin costs %." };
  if (isNaN(loanLossReservePct) || loanLossReservePct < 0 || loanLossReservePct > 100)
    return { error: "Invalid loan loss reserve %." };
  if (adminCostsPct + loanLossReservePct >= 100)
    return { error: "Admin costs + reserve must be less than 100%." };

  const adminCosts = totalProfit * (adminCostsPct / 100);
  const loanLossReserve = totalProfit * (loanLossReservePct / 100);
  const dividendPool = totalProfit - adminCosts - loanLossReserve;

  const contributionGroups = await prisma.contribution.groupBy({
    by: ["userId"],
    where: { cooperativeId, status: "VERIFIED", deletedAt: null },
    _sum: { amount: true },
  });

  if (contributionGroups.length === 0) {
    return { error: "No verified contributions found to distribute." };
  }

  const totalContributed = contributionGroups.reduce(
    (sum, c) => sum + Number(c._sum.amount ?? 0),
    0
  );

  try {
    await prisma.$transaction(async (tx) => {
      const payout = await tx.dividendPayout.create({
        data: {
          cooperativeId,
          period,
          year,
          totalProfit,
          adminCosts,
          loanLossReserve,
          dividendPool,
          totalMembers: contributionGroups.length,
          status: "PENDING",
        },
      });

      await tx.memberDividend.createMany({
        data: contributionGroups.map((c) => {
          const pct = Number(c._sum.amount ?? 0) / totalContributed;
          return {
            payoutId: payout.id,
            userId: c.userId,
            cooperativeId,
            contributionPct: pct * 100,
            amount: dividendPool * pct,
            status: "PENDING",
          };
        }),
      });

      await tx.event.create({
        data: {
          cooperativeId,
          eventType: "dividend_payout_created",
          actorId: session.user.id,
          actorType: "admin",
          entityType: "dividend",
          data: {
            payoutId: payout.id,
            period,
            year,
            totalProfit,
            dividendPool,
            memberCount: contributionGroups.length,
          },
        },
      });
    });
  } catch {
    return { error: "Failed to create dividend payout." };
  }

  revalidatePath("/admin/dividends");
  return { success: true };
}

export async function approveDividendPayout(
  _prev: DividendActionState,
  formData: FormData
): Promise<DividendActionState> {
  const cooperativeId = (formData.get("cooperativeId") as string)?.trim();
  const payoutId = (formData.get("payoutId") as string)?.trim();
  if (!cooperativeId || !payoutId) return { error: "Missing required fields." };

  const session = await protectAdminAction(cooperativeId);

  const payout = await prisma.dividendPayout.findUnique({ where: { id: payoutId } });
  if (!payout || payout.cooperativeId !== cooperativeId) return { error: "Payout not found." };
  if (payout.status !== "PENDING") return { error: "Payout is not pending." };

  await prisma.dividendPayout.update({
    where: { id: payoutId },
    data: { status: "APPROVED", approvedAt: new Date(), approvedBy: session.user.id },
  });

  await prisma.event.create({
    data: {
      cooperativeId,
      eventType: "dividend_payout_approved",
      actorId: session.user.id,
      actorType: "admin",
      entityType: "dividend",
      data: { payoutId, dividendPool: String(payout.dividendPool) },
    },
  });

  revalidatePath("/admin/dividends");
  return { success: true };
}

export async function processDividendPayout(
  _prev: DividendActionState,
  formData: FormData
): Promise<DividendActionState> {
  const cooperativeId = (formData.get("cooperativeId") as string)?.trim();
  const payoutId = (formData.get("payoutId") as string)?.trim();
  if (!cooperativeId || !payoutId) return { error: "Missing required fields." };

  const session = await protectAdminAction(cooperativeId);

  const payout = await prisma.dividendPayout.findUnique({
    where: { id: payoutId },
    include: { memberDividends: true },
  });

  if (!payout || payout.cooperativeId !== cooperativeId) return { error: "Payout not found." };
  if (payout.status !== "APPROVED") return { error: "Payout must be approved before processing." };

  const now = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      await tx.memberDividend.updateMany({
        where: { payoutId },
        data: { status: "PAID", paidAt: now },
      });

      await tx.dividendPayout.update({
        where: { id: payoutId },
        data: { status: "PAID", paidAt: now },
      });

      await tx.event.create({
        data: {
          cooperativeId,
          eventType: "dividend_payout_processed",
          actorId: session.user.id,
          actorType: "admin",
          entityType: "dividend",
          data: {
            payoutId,
            totalMembers: payout.memberDividends.length,
            dividendPool: String(payout.dividendPool),
          },
        },
      });
    });
  } catch {
    return { error: "Failed to process payout." };
  }

  // Send member notifications outside the transaction
  for (const d of payout.memberDividends) {
    notifyDividendPaid(d.userId, cooperativeId, Number(d.amount)).catch(() => {});
  }

  revalidatePath("/admin/dividends");
  return { success: true };
}
