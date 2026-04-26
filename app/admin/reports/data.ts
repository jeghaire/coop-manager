import prisma from "@/app/lib/prisma";

export async function getFinancialSummary(cooperativeId: string) {
  const [
    verifiedContribs,
    pendingContribs,
    approvedLoans,
    activeLoans,
    totalMembers,
    allMembers,
  ] = await Promise.all([
    prisma.contribution.aggregate({
      where: { cooperativeId, status: "VERIFIED", deletedAt: null },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.contribution.aggregate({
      where: { cooperativeId, status: "PENDING_VERIFICATION", deletedAt: null },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.loanApplication.aggregate({
      where: { cooperativeId, status: "APPROVED", deletedAt: null },
      _sum: { amountRequested: true },
      _count: true,
    }),
    prisma.loanApplication.count({
      where: {
        cooperativeId,
        status: { in: ["PENDING_GUARANTORS", "PENDING_ADMIN_REVIEW"] },
        deletedAt: null,
      },
    }),
    prisma.user.count({ where: { cooperativeId, deletedAt: null } }),
    prisma.user.findMany({
      where: { cooperativeId, deletedAt: null },
      select: { monthlyContributionAmount: true },
    }),
  ]);

  const totalVerified = Number(verifiedContribs._sum.amount ?? 0);
  const totalLoaned = Number(approvedLoans._sum.amountRequested ?? 0);
  const monthlyTarget = allMembers.reduce(
    (sum, u) => sum + Number(u.monthlyContributionAmount),
    0
  );

  return {
    totalVerified,
    verifiedCount: verifiedContribs._count,
    pendingAmount: Number(pendingContribs._sum.amount ?? 0),
    pendingCount: pendingContribs._count,
    totalLoaned,
    loanedCount: approvedLoans._count,
    activeLoans,
    availableFunds: totalVerified - totalLoaned,
    totalMembers,
    monthlyTarget,
  };
}

export async function getLoanDecisions(cooperativeId: string) {
  const loans = await prisma.loanApplication.findMany({
    where: {
      cooperativeId,
      status: { in: ["APPROVED", "REJECTED"] },
      deletedAt: null,
    },
    include: {
      applicant: { select: { name: true } },
      reviewer: { select: { name: true } },
    },
    orderBy: { reviewedAt: "desc" },
  });

  const total = loans.length;
  const approved = loans.filter((l) => l.status === "APPROVED");
  const rejected = loans.filter((l) => l.status === "REJECTED");

  // Group by reviewer
  const byReviewer: Record<
    string,
    { name: string; approved: number; rejected: number }
  > = {};
  for (const loan of loans) {
    const name = loan.reviewer?.name ?? "Unknown";
    const key = loan.reviewedBy ?? "unknown";
    if (!byReviewer[key]) byReviewer[key] = { name, approved: 0, rejected: 0 };
    if (loan.status === "APPROVED") byReviewer[key].approved++;
    else byReviewer[key].rejected++;
  }

  // Group rejection reasons
  const reasons: Record<string, number> = {};
  for (const loan of rejected) {
    const reason = loan.rejectionReason ?? "No reason given";
    reasons[reason] = (reasons[reason] ?? 0) + 1;
  }

  return {
    loans,
    total,
    approvedCount: approved.length,
    rejectedCount: rejected.length,
    approvalRate: total > 0 ? Math.round((approved.length / total) * 100) : 0,
    totalApprovedAmount: approved.reduce(
      (s, l) => s + Number(l.amountRequested),
      0
    ),
    byReviewer: Object.values(byReviewer),
    rejectionReasons: Object.entries(reasons).sort((a, b) => b[1] - a[1]),
  };
}

export async function getDividendSnapshot(cooperativeId: string) {
  const [memberContribs, members] = await Promise.all([
    prisma.contribution.groupBy({
      by: ["userId"],
      where: { cooperativeId, status: "VERIFIED", deletedAt: null },
      _sum: { amount: true },
    }),
    prisma.user.findMany({
      where: { cooperativeId, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        monthlyContributionAmount: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const contribMap = new Map(
    memberContribs.map((c) => [c.userId, Number(c._sum.amount ?? 0)])
  );

  const grandTotal = memberContribs.reduce(
    (s, c) => s + Number(c._sum.amount ?? 0),
    0
  );

  const rows = members.map((m) => {
    const total = contribMap.get(m.id) ?? 0;
    const pct = grandTotal > 0 ? (total / grandTotal) * 100 : 0;
    return {
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
      totalContributed: total,
      percentage: pct,
      monthlyTarget: Number(m.monthlyContributionAmount),
    };
  });

  rows.sort((a, b) => b.totalContributed - a.totalContributed);

  return { rows, grandTotal };
}
