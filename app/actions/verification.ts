"use server";

import prisma from "@/app/lib/prisma";
import { requireAuth } from "@/app/lib/auth-helpers";
import { revalidatePath } from "next/cache";

export type VerificationActionState = {
  error?: string;
  success?: boolean;
};

export async function verifyMember(
  _prev: VerificationActionState,
  formData: FormData
): Promise<VerificationActionState> {
  const session = await requireAuth();
  const role = session.user.role as string;

  if (role !== "ADMIN" && role !== "OWNER") {
    return { error: "Only admins can verify members." };
  }

  const memberId = (formData.get("memberId") as string)?.trim();
  const cooperativeId = session.user.cooperativeId as string;

  if (!memberId) return { error: "Missing member ID." };

  const member = await prisma.user.findUnique({
    where: { id: memberId },
    select: { cooperativeId: true, verifiedAt: true, name: true },
  });

  if (!member || member.cooperativeId !== cooperativeId) {
    return { error: "Member not found." };
  }

  if (member.verifiedAt) {
    return { error: "Member is already verified." };
  }

  await prisma.user.update({
    where: { id: memberId },
    data: {
      verifiedAt: new Date(),
      verifiedBy: session.user.id,
    },
  });

  await prisma.event.create({
    data: {
      cooperativeId,
      eventType: "member_verified",
      actorId: session.user.id,
      actorType: "admin",
      entityType: "user",
      data: { memberId, memberName: member.name },
    },
  });

  revalidatePath("/admin/members/unverified");
  revalidatePath("/admin/members");
  return { success: true };
}
