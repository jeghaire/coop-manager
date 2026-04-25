import { requireCooperativeAccess } from "@/app/lib/middleware";
import prisma from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const cooperativeId = request.nextUrl.searchParams.get("cooperativeId");

    if (!cooperativeId) {
      return NextResponse.json(
        { error: "cooperativeId required" },
        { status: 400 },
      );
    }

    // Guard: verify user belongs to this cooperative
    const session = await requireCooperativeAccess(cooperativeId);
    const userId = session.user.id;

    // Get member's contributions
    const contributions = await prisma.contribution.findMany({
      where: {
        userId,
        cooperativeId: cooperativeId,
        status: "VERIFIED",
      },
    });

    const totalContributed = contributions.reduce(
      (sum, c) => sum + c.amount.toNumber(),
      0,
    );

    // Get member's loans
    const loans = await prisma.loanApplication.findMany({
      where: {
        userId,
        cooperativeId: cooperativeId,
      },
      include: {
        guarantors: true,
      },
    });

    const totalBorrowed = loans
      .filter((l) => l.status === "APPROVED")
      .reduce((sum, l) => sum + l.amountRequested.toNumber(), 0);

    // Calculate borrowing capacity (3x contribution rule)
    const borrowingCapacity = totalContributed * 3 - totalBorrowed;

    // Get user's monthly contribution amount
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    return NextResponse.json(
      {
        name: user?.name,
        email: user?.email,
        role: user?.role,
        monthlyContributionAmount: user?.monthlyContributionAmount,
        totalContributed,
        totalBorrowed,
        borrowingCapacity: Math.max(borrowingCapacity, 0),
        loanCount: loans.length,
        pendingLoans: loans.filter((l) => l.status === "PENDING_GUARANTORS")
          .length,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Member dashboard error:", error);

    if (
      error.message.includes("Unauthorized") ||
      error.message.includes("Forbidden")
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes("Unauthorized") ? 401 : 403 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
