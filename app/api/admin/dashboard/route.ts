import {
  requireCooperativeAccess,
  requireAdminRole,
} from "@/app/lib/middleware";
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

    // Guard: verify user belongs to this cooperative and is admin
    const session = await requireCooperativeAccess(cooperativeId);
    await requireAdminRole(session);

    // Now fetch data safely
    const cooperative = await prisma.cooperative.findUnique({
      where: { id: cooperativeId },
      include: {
        users: {
          where: { deletedAt: null },
        },
      },
    });

    const pendingLoans = await prisma.loanApplication.findMany({
      where: {
        cooperativeId,
        status: "PENDING_ADMIN_REVIEW",
      },
      include: {
        applicant: true,
        guarantors: {
          include: {
            guarantor: true,
          },
        },
      },
    });

    const pendingContributions = await prisma.contribution.findMany({
      where: {
        cooperativeId,
        status: "PENDING_VERIFICATION",
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json(
      {
        cooperative,
        pendingLoans,
        pendingContributions,
        memberCount: cooperative?.users.length || 0,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Admin dashboard error:", error);

    // Check if it's an authorization error
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
