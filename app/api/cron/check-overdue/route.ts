import prisma from "@/app/lib/prisma";
import { calculateLoanHealth } from "@/app/lib/loan-helpers";
import { notifyPaymentOverdue } from "@/app/lib/notifications";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loans = await prisma.loanApplication.findMany({
    where: { status: "APPROVED", repaidAt: null, deletedAt: null },
    include: {
      repayments: { select: { amount: true } },
      cooperative: { select: { defaultGracePeriodDays: true } },
    },
  });

  let notified = 0;

  for (const loan of loans) {
    if (!loan.approvedAt || !loan.totalAmountDue || !loan.repaymentMonths) continue;

    const totalPaid = loan.repayments.reduce((s, r) => s + Number(r.amount), 0);
    const health = calculateLoanHealth(
      Number(loan.totalAmountDue),
      totalPaid,
      loan.approvedAt,
      loan.repaymentMonths,
      loan.cooperative.defaultGracePeriodDays
    );

    if (health.status !== "BEHIND" && health.status !== "DEFAULTED") continue;
    if (health.daysOverdue <= 0) continue;

    // Only notify once per day
    const recent = await prisma.notification.findFirst({
      where: {
        userId: loan.userId,
        type: "PAYMENT_OVERDUE",
        createdAt: { gte: new Date(Date.now() - 23 * 60 * 60 * 1000) },
      },
    });

    if (!recent) {
      await notifyPaymentOverdue(
        loan.userId,
        loan.cooperativeId,
        health.amountBehind,
        health.daysOverdue
      ).catch(() => {});
      notified++;
    }
  }

  return Response.json({ success: true, loansChecked: loans.length, notified });
}
