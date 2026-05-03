"use server";

import prisma from "@/app/lib/prisma";
import { requireAuth, protectAdminAction } from "@/app/lib/auth-helpers";

// ─── Member Financial Summary ────────────────────────────────────────────────

export type MemberSummaryData = {
  memberId: string;
  memberName: string;
  memberEmail: string;
  totalVerifiedContributions: number;
  activeLoanBalance: number;
  totalDividendsReceived: number;
  withdrawalPendingAmount: number;
  contributionCount: number;
  loanCount: number;
};

export async function getMemberFinancialSummary(
  cooperativeId: string,
  userId: string
): Promise<MemberSummaryData> {
  const session = await requireAuth();

  const role = session.user.role as string;
  const isAdminOrOwner = role === "ADMIN" || role === "OWNER";
  const isSelf = session.user.id === userId;

  if (!isSelf && !isAdminOrOwner) {
    throw new Error("Forbidden: Access denied");
  }

  if ((session.user.cooperativeId as string) !== cooperativeId) {
    throw new Error("Forbidden: Access denied to this cooperative");
  }

  const [user, contributions, loans, dividends, withdrawals] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      }),
      prisma.contribution.findMany({
        where: { userId, cooperativeId, deletedAt: null },
        select: { amount: true, status: true },
      }),
      prisma.loanApplication.findMany({
        where: { userId, cooperativeId, deletedAt: null },
        include: { repayments: { select: { amount: true } } },
      }),
      prisma.memberDividend.findMany({
        where: { userId, cooperativeId, status: "PAID" },
        select: { amount: true },
      }),
      prisma.withdrawalRequest.findMany({
        where: {
          userId,
          cooperativeId,
          status: "REQUESTED",
          deletedAt: null,
        },
        select: { amount: true },
      }),
    ]);

  if (!user) throw new Error("User not found");

  const totalVerifiedContributions = contributions
    .filter((c) => c.status === "VERIFIED")
    .reduce((sum, c) => sum + Number(c.amount), 0);

  const contributionCount = contributions.filter(
    (c) => c.status === "VERIFIED"
  ).length;

  let activeLoanBalance = 0;
  let loanCount = 0;
  for (const loan of loans) {
    if (loan.status === "APPROVED" && !loan.repaidAt) {
      const paid = loan.repayments.reduce((s, r) => s + Number(r.amount), 0);
      activeLoanBalance +=
        Number(loan.totalAmountDue ?? loan.amountRequested) - paid;
      loanCount++;
    }
  }

  const totalDividendsReceived = dividends.reduce(
    (sum, d) => sum + Number(d.amount),
    0
  );

  const withdrawalPendingAmount = withdrawals.reduce(
    (sum, w) => sum + Number(w.amount),
    0
  );

  return {
    memberId: user.id,
    memberName: user.name,
    memberEmail: user.email,
    totalVerifiedContributions,
    activeLoanBalance,
    totalDividendsReceived,
    withdrawalPendingAmount,
    contributionCount,
    loanCount,
  };
}

// ─── Cooperative Overview ─────────────────────────────────────────────────────

export type CoopOverviewData = {
  totalVerifiedContributions: number;
  totalOutstandingLoanBalance: number;
  totalDividendsPaid: number;
  netCapital: number;
  totalMembers: number;
  verifiedMembers: number;
  unverifiedMembers: number;
  activeLoanCount: number;
  totalLoanCount: number;
  defaultedLoanCount: number;
  dividendPayoutsCount: number;
};

export async function getCooperativeOverview(
  cooperativeId: string
): Promise<CoopOverviewData> {
  await protectAdminAction(cooperativeId);

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const [
    verifiedContribs,
    approvedLoans,
    dividendsPaid,
    members,
    verifiedMembers,
    activeLoanCount,
    totalLoanCount,
    dividendPayoutsCount,
    loansWithRepayments,
  ] = await Promise.all([
    prisma.contribution.aggregate({
      where: { cooperativeId, status: "VERIFIED", deletedAt: null },
      _sum: { amount: true },
    }),
    prisma.loanApplication.findMany({
      where: {
        cooperativeId,
        status: "APPROVED",
        repaidAt: null,
        deletedAt: null,
      },
      include: { repayments: { select: { amount: true, paidAt: true } } },
    }),
    prisma.memberDividend.aggregate({
      where: { cooperativeId, status: "PAID" },
      _sum: { amount: true },
    }),
    prisma.user.count({ where: { cooperativeId, deletedAt: null } }),
    prisma.user.count({
      where: { cooperativeId, deletedAt: null, verifiedAt: { not: null } },
    }),
    prisma.loanApplication.count({
      where: {
        cooperativeId,
        status: "APPROVED",
        repaidAt: null,
        deletedAt: null,
      },
    }),
    prisma.loanApplication.count({
      where: { cooperativeId, deletedAt: null },
    }),
    prisma.dividendPayout.count({ where: { cooperativeId } }),
    prisma.loanApplication.findMany({
      where: {
        cooperativeId,
        status: "APPROVED",
        repaidAt: null,
        deletedAt: null,
      },
      include: {
        repayments: { orderBy: { paidAt: "desc" }, take: 1, select: { paidAt: true } },
      },
    }),
  ]);

  const totalVerifiedContributions = Number(
    verifiedContribs._sum.amount ?? 0
  );

  // Outstanding balance = totalAmountDue - sum of repayments for each active loan
  let totalOutstandingLoanBalance = 0;
  for (const loan of approvedLoans) {
    const paid = loan.repayments.reduce((s, r) => s + Number(r.amount), 0);
    totalOutstandingLoanBalance +=
      Number(loan.totalAmountDue ?? loan.amountRequested) - paid;
  }

  // Count loans with no repayment in 90+ days
  let defaultedLoanCount = 0;
  for (const loan of loansWithRepayments) {
    const lastRepayment = loan.repayments[0];
    if (!lastRepayment) {
      // Check if loan was approved more than 90 days ago
      if (loan.approvedAt && loan.approvedAt < ninetyDaysAgo) {
        defaultedLoanCount++;
      }
    } else if (lastRepayment.paidAt < ninetyDaysAgo) {
      defaultedLoanCount++;
    }
  }

  const totalDividendsPaid = Number(dividendsPaid._sum.amount ?? 0);
  const netCapital = totalVerifiedContributions - totalOutstandingLoanBalance;

  return {
    totalVerifiedContributions,
    totalOutstandingLoanBalance,
    totalDividendsPaid,
    netCapital,
    totalMembers: members,
    verifiedMembers,
    unverifiedMembers: members - verifiedMembers,
    activeLoanCount,
    totalLoanCount,
    defaultedLoanCount,
    dividendPayoutsCount,
  };
}

// ─── Loan Report ──────────────────────────────────────────────────────────────

export type LoanReportLoan = {
  id: string;
  userName: string;
  userEmail: string;
  amountRequested: number;
  totalAmountDue: number;
  status: string;
  interestRate: number | null;
  repaymentMonths: number | null;
  approvedAt: Date | null;
  repaidAt: Date | null;
  repaymentProgress: number;
  totalRepaid: number;
};

export type LoanReportData = {
  loans: LoanReportLoan[];
  statusCounts: Record<string, number>;
  totalApprovedAmount: number;
  totalOutstanding: number;
  averageInterestRate: number;
};

export async function getLoanReport(
  cooperativeId: string
): Promise<LoanReportData> {
  await protectAdminAction(cooperativeId);

  const loans = await prisma.loanApplication.findMany({
    where: { cooperativeId, deletedAt: null },
    include: {
      applicant: { select: { name: true, email: true } },
      repayments: { select: { amount: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const statusCounts: Record<string, number> = {};
  let totalApprovedAmount = 0;
  let totalOutstanding = 0;
  let interestRateSum = 0;
  let interestRateCount = 0;

  const mapped: LoanReportLoan[] = loans.map((loan) => {
    const status = loan.status as string;
    statusCounts[status] = (statusCounts[status] ?? 0) + 1;

    const amountRequested = Number(loan.amountRequested);
    const totalAmountDue = Number(loan.totalAmountDue ?? loan.amountRequested);
    const totalRepaid = loan.repayments.reduce(
      (s, r) => s + Number(r.amount),
      0
    );

    if (status === "APPROVED" || status === "REPAID") {
      totalApprovedAmount += amountRequested;
    }

    let outstanding = 0;
    if (status === "APPROVED" && !loan.repaidAt) {
      outstanding = totalAmountDue - totalRepaid;
      totalOutstanding += outstanding;
    }

    if (loan.interestRate != null) {
      interestRateSum += Number(loan.interestRate);
      interestRateCount++;
    }

    const repaymentProgress =
      totalAmountDue > 0
        ? Math.min(100, Math.round((totalRepaid / totalAmountDue) * 100))
        : 0;

    return {
      id: loan.id,
      userName: loan.applicant.name,
      userEmail: loan.applicant.email,
      amountRequested,
      totalAmountDue,
      status,
      interestRate: loan.interestRate != null ? Number(loan.interestRate) : null,
      repaymentMonths: loan.repaymentMonths,
      approvedAt: loan.approvedAt,
      repaidAt: loan.repaidAt,
      repaymentProgress,
      totalRepaid,
    };
  });

  return {
    loans: mapped,
    statusCounts,
    totalApprovedAmount,
    totalOutstanding,
    averageInterestRate:
      interestRateCount > 0
        ? Math.round((interestRateSum / interestRateCount) * 10) / 10
        : 0,
  };
}

// ─── Audit Trail ─────────────────────────────────────────────────────────────

export type AuditTrailEvent = {
  id: string;
  timestamp: Date;
  eventType: string;
  actorName: string | null;
  actorId: string | null;
  entityType: string | null;
  entityId: number | null;
  data: unknown;
};

export async function getAuditTrail(
  cooperativeId: string,
  filters?: { startDate?: string; endDate?: string; eventType?: string }
): Promise<AuditTrailEvent[]> {
  await protectAdminAction(cooperativeId);

  const where: {
    cooperativeId: string;
    eventType?: string;
    createdAt?: { gte?: Date; lte?: Date };
  } = { cooperativeId };

  if (filters?.eventType) {
    where.eventType = filters.eventType;
  }

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  const events = await prisma.event.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  // Collect unique actor IDs and batch-fetch names
  const actorIds = [
    ...new Set(events.map((e) => e.actorId).filter(Boolean) as string[]),
  ];

  const actors =
    actorIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, name: true },
        })
      : [];

  const actorMap = new Map(actors.map((a) => [a.id, a.name]));

  return events.map((e) => ({
    id: e.id,
    timestamp: e.createdAt,
    eventType: e.eventType,
    actorId: e.actorId,
    actorName: e.actorId ? (actorMap.get(e.actorId) ?? null) : null,
    entityType: e.entityType,
    entityId: e.entityId,
    data: e.data,
  }));
}

// ─── Contribution Report ──────────────────────────────────────────────────────

export type ContributionReportMember = {
  userId: string;
  name: string;
  email: string;
  totalVerified: number;
  totalPending: number;
  rejectionCount: number;
};

export type ContributionReportData = {
  countByStatus: Record<string, number>;
  sumByStatus: Record<string, number>;
  members: ContributionReportMember[];
};

export async function getContributionReport(
  cooperativeId: string
): Promise<ContributionReportData> {
  await protectAdminAction(cooperativeId);

  const [contributions, users] = await Promise.all([
    prisma.contribution.findMany({
      where: { cooperativeId, deletedAt: null },
      select: {
        userId: true,
        amount: true,
        status: true,
      },
    }),
    prisma.user.findMany({
      where: { cooperativeId, deletedAt: null },
      select: { id: true, name: true, email: true },
    }),
  ]);

  const userMap = new Map(users.map((u) => [u.id, u]));

  const countByStatus: Record<string, number> = {};
  const sumByStatus: Record<string, number> = {};
  const memberMap = new Map<
    string,
    ContributionReportMember
  >();

  for (const c of contributions) {
    const status = c.status as string;
    countByStatus[status] = (countByStatus[status] ?? 0) + 1;
    sumByStatus[status] = (sumByStatus[status] ?? 0) + Number(c.amount);

    if (!memberMap.has(c.userId)) {
      const user = userMap.get(c.userId);
      memberMap.set(c.userId, {
        userId: c.userId,
        name: user?.name ?? "Unknown",
        email: user?.email ?? "",
        totalVerified: 0,
        totalPending: 0,
        rejectionCount: 0,
      });
    }

    const member = memberMap.get(c.userId)!;
    if (status === "VERIFIED") {
      member.totalVerified += Number(c.amount);
    } else if (status === "PENDING_VERIFICATION") {
      member.totalPending += Number(c.amount);
    } else if (status === "REJECTED") {
      member.rejectionCount++;
    }
  }

  const members = Array.from(memberMap.values()).sort(
    (a, b) => b.totalVerified - a.totalVerified
  );

  return { countByStatus, sumByStatus, members };
}
