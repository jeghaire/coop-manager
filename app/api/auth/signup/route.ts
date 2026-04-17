import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { cooperativeName } = await request.json();

  if (!cooperativeName) {
    return NextResponse.json(
      { error: "Cooperative name is required" },
      { status: 400 },
    );
  }

  try {
    // Create cooperative
    const cooperative = await prisma.cooperative.create({
      data: {
        name: cooperativeName,
        subscriptionStatus: "ACTIVE",
      },
    });

    return NextResponse.json(
      {
        message: "Cooperative created successfully",
        cooperativeId: cooperative.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
