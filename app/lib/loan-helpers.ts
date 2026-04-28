export function calculateLoanTotals(principal: number, interestRatePct: number) {
  const interest = principal * (interestRatePct / 100);
  const totalDue = principal + interest;
  const monthlyPayment = totalDue / 12; // placeholder, real calc uses repaymentMonths
  return { interest, totalDue };
}

export function calculateMonthlyPayment(totalDue: number, repaymentMonths: number) {
  return totalDue / repaymentMonths;
}

export type RepaymentMonth = {
  month: number;
  dueDate: Date;
  monthlyDue: number;
};

export function generateRepaymentSchedule(
  totalDue: number,
  repaymentMonths: number,
  approvedAt: Date
): RepaymentMonth[] {
  const monthlyDue = totalDue / repaymentMonths;
  return Array.from({ length: repaymentMonths }, (_, i) => {
    const dueDate = new Date(approvedAt);
    dueDate.setMonth(dueDate.getMonth() + i + 1);
    return { month: i + 1, dueDate, monthlyDue };
  });
}

export type LoanHealth = {
  status: "ON_TRACK" | "BEHIND" | "DEFAULTED" | "REPAID";
  daysOverdue: number;
  amountBehind: number;
  monthsElapsed: number;
  percentPaid: number;
};

export function calculateLoanHealth(
  totalDue: number,
  amountPaid: number,
  approvedAt: Date,
  repaymentMonths: number,
  gracePeriodDays = 30
): LoanHealth {
  const percentPaid = totalDue > 0 ? (amountPaid / totalDue) * 100 : 0;

  if (amountPaid >= totalDue) {
    return { status: "REPAID", daysOverdue: 0, amountBehind: 0, monthsElapsed: 0, percentPaid: 100 };
  }

  const now = new Date();
  const msPerMonth = 30.44 * 24 * 60 * 60 * 1000;
  const monthsElapsed = Math.min(
    repaymentMonths,
    Math.floor((now.getTime() - approvedAt.getTime()) / msPerMonth)
  );

  const monthlyPayment = totalDue / repaymentMonths;
  const expectedPaid = monthlyPayment * monthsElapsed;
  const amountBehind = Math.max(0, expectedPaid - amountPaid);

  if (amountBehind === 0) {
    return { status: "ON_TRACK", daysOverdue: 0, amountBehind: 0, monthsElapsed, percentPaid };
  }

  // Days past last due date
  const lastDueDate = new Date(approvedAt);
  lastDueDate.setMonth(lastDueDate.getMonth() + monthsElapsed);
  const daysPastDue = Math.floor(
    (now.getTime() - lastDueDate.getTime()) / (24 * 60 * 60 * 1000)
  );

  const status = daysPastDue > gracePeriodDays ? "DEFAULTED" : "BEHIND";
  return {
    status,
    daysOverdue: Math.max(0, daysPastDue - gracePeriodDays),
    amountBehind,
    monthsElapsed,
    percentPaid,
  };
}
