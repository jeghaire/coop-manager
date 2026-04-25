import { auth } from "@/app/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  const { cooperativeName, email, password, name } = await request.json();

  if (!cooperativeName || !email || !password || !name) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
        cooperativeName,
        role: "OWNER"
      },
      headers: await headers()
    });

    return NextResponse.json(
      { message: "Account created. Please check your email to verify your account." },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Signup error:", error);

    const status = error.status ?? error.statusCode;
    if (status === 400 || status === 422) {
      return NextResponse.json(
        { error: error.body?.message || error.message || "Invalid request" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
