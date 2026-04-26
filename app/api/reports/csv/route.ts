import { getSession } from "@/app/lib/auth-helpers";
import { NextRequest, NextResponse } from "next/server";
import { getFinancialSummary, getDividendSnapshot, getLoanDecisions } from "@/app/admin/reports/data";

function csvRow(cells: (string | number)[]): string {
  return cells
    .map((c) => {
      const s = String(c);
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    })
    .join(",");
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role as string;
  if (role !== "ADMIN" && role !== "OWNER" && role !== "TREASURER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cooperativeId = session.user.cooperativeId as string;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "financial";
  const distribute = Number(searchParams.get("distribute") ?? 0);

  let csv = "";
  let filename = "report.csv";

  if (type === "financial") {
    const data = await getFinancialSummary(cooperativeId);
    filename = "financial-summary.csv";
    csv = [
      csvRow(["Metric", "Value"]),
      csvRow(["Total Verified Contributions (₦)", data.totalVerified]),
      csvRow(["Verified Payment Count", data.verifiedCount]),
      csvRow(["Pending Contributions (₦)", data.pendingAmount]),
      csvRow(["Pending Count", data.pendingCount]),
      csvRow(["Total Approved Loans (₦)", data.totalLoaned]),
      csvRow(["Approved Loan Count", data.loanedCount]),
      csvRow(["Loans in Pipeline", data.activeLoans]),
      csvRow(["Available Funds (₦)", data.availableFunds]),
      csvRow(["Total Active Members", data.totalMembers]),
      csvRow(["Monthly Contribution Target (₦)", data.monthlyTarget]),
    ].join("\n");
  } else if (type === "dividends") {
    const { rows, grandTotal } = await getDividendSnapshot(cooperativeId);
    filename = "dividend-snapshot.csv";
    const headers = ["Name", "Email", "Role", "Total Contributed (₦)", "Share %"];
    if (distribute > 0) headers.push("Dividend (₦)");
    csv = [
      csvRow(headers),
      ...rows.map((r) => {
        const row: (string | number)[] = [
          r.name,
          r.email,
          r.role,
          r.totalContributed,
          r.percentage.toFixed(2),
        ];
        if (distribute > 0) {
          row.push(Math.round((r.percentage / 100) * distribute));
        }
        return csvRow(row);
      }),
      csvRow(distribute > 0
        ? ["TOTAL", "", "", grandTotal, "100.00", distribute]
        : ["TOTAL", "", "", grandTotal, "100.00"]),
    ].join("\n");
  } else if (type === "loans") {
    const data = await getLoanDecisions(cooperativeId);
    filename = "loan-decisions.csv";
    csv = [
      csvRow(["Applicant", "Amount (₦)", "Status", "Reviewed By", "Date", "Rejection Reason"]),
      ...data.loans.map((l) =>
        csvRow([
          l.applicant.name,
          Number(l.amountRequested),
          l.status,
          l.reviewer?.name ?? "",
          l.reviewedAt ? new Date(l.reviewedAt).toLocaleDateString("en-GB") : "",
          l.rejectionReason ?? "",
        ])
      ),
    ].join("\n");
  } else {
    return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
