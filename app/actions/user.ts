"use server";

import prisma from "@/app/lib/prisma";
import { requireAuth } from "@/app/lib/auth-helpers";
import { revalidatePath } from "next/cache";

export type UserActionState = { error?: string; success?: boolean };

export async function updateNotificationSettings(
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const session = await requireAuth();

  const phoneNumber = (formData.get("phoneNumber") as string)?.trim() || null;
  const emailNotifications = formData.get("emailNotifications") === "on";
  const smsNotifications = formData.get("smsNotifications") === "on";

  if (phoneNumber && !/^\+?[\d\s\-().]{7,20}$/.test(phoneNumber)) {
    return { error: "Invalid phone number format." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { phoneNumber, emailNotifications, smsNotifications },
  });

  revalidatePath("/dashboard/settings");
  return { success: true };
}
