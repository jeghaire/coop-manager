import { auth } from "@/app/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  const response = await auth.api.signOut({
    headers: request.headers,
  });

  return response;
}
