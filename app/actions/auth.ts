"use server";

import { auth } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export type SignUpState = {
  error?: string;
  success?: boolean;
};

export async function signUpUser(
  _prev: SignUpState,
  formData: FormData
): Promise<SignUpState> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const cooperativeId = formData.get("cooperativeId") as string;

  if (!name || !email || !password || !cooperativeId) {
    return { error: "All fields are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const cooperative = await prisma.cooperative.findUnique({
    where: { id: cooperativeId, deletedAt: null }
  });
  if (!cooperative) {
    return { error: "Selected cooperative does not exist." };
  }

  try {
    const result = await auth.api.signUpEmail({
      body: { name, email, password, cooperativeId, role: "MEMBER" },
      headers: await headers()
    });

    if (!result?.user) {
      return { error: "Failed to create account. Please try again." };
    }
  } catch (err: any) {
    const msg: string = err?.body?.message || err?.message || "";
    if (msg.toLowerCase().includes("already")) {
      return { error: "An account with this email already exists." };
    }
    return { error: msg || "Something went wrong. Please try again." };
  }

  redirect("/auth/signin?registered=1");
}

export async function getCooperatives() {
  return prisma.cooperative.findMany({
    where: { deletedAt: null, subscriptionStatus: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { name: "asc" }
  });
}
