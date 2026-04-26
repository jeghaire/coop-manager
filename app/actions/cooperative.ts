"use server";

import prisma from "@/app/lib/prisma";
import { auth } from "@/app/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export type CreateCoopState = {
  error?: string;
};

export async function createCooperative(
  _prev: CreateCoopState,
  formData: FormData
): Promise<CreateCoopState> {
  const coopName = (formData.get("coopName") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = (formData.get("password") as string) ?? "";

  if (!coopName || !name || !email || !password) {
    return { error: "All fields are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { error: "An account with this email already exists." };
  }

  const existingCoop = await prisma.cooperative.findFirst({
    where: { name: coopName, deletedAt: null },
  });
  if (existingCoop) {
    return { error: "A cooperative with this name already exists." };
  }

  // Create cooperative first so we have its ID for signUpEmail
  const cooperative = await prisma.cooperative.create({
    data: { name: coopName },
  });

  try {
    const result = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
        cooperativeId: cooperative.id,
        role: "OWNER",
      },
      headers: await headers(),
    });

    if (!result?.user) {
      await prisma.cooperative.delete({ where: { id: cooperative.id } });
      return { error: "Failed to create account. Please try again." };
    }

    await prisma.event.create({
      data: {
        cooperativeId: cooperative.id,
        eventType: "cooperative_created",
        actorId: result.user.id,
        actorType: "user",
        entityType: "cooperative",
        data: { cooperativeName: coopName, ownerEmail: email },
      },
    });
  } catch (err: any) {
    await prisma.cooperative.delete({ where: { id: cooperative.id } });
    const msg: string = err?.body?.message || err?.message || "";
    return { error: msg || "Failed to set up your cooperative." };
  }

  redirect("/auth/signin?registered=1");
}
