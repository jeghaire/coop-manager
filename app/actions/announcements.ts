"use server";

import prisma from "@/app/lib/prisma";
import { requireAuth, protectAdminAction } from "@/app/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import { notifyAnnouncement } from "@/app/lib/notifications";

export type AnnouncementActionState = {
  error?: string;
  success?: boolean;
};

const VALID_TYPES = ["AGM", "MAINTENANCE", "RULE_CHANGE", "GENERAL"] as const;
const VALID_RECIPIENT_TYPES = ["ALL", "MEMBERS_ONLY", "ADMINS_ONLY"] as const;
const VALID_RSVP_STATUSES = ["ATTENDING", "NOT_ATTENDING", "MAYBE"] as const;

export async function createAnnouncement(
  _prev: AnnouncementActionState,
  formData: FormData
): Promise<AnnouncementActionState> {
  const cooperativeId = (formData.get("cooperativeId") as string)?.trim();
  if (!cooperativeId) return { error: "Missing cooperative ID." };

  const session = await protectAdminAction(cooperativeId);

  const title = (formData.get("title") as string)?.trim();
  const message = (formData.get("message") as string)?.trim();
  const type = (formData.get("type") as string)?.trim();
  const recipientType = (formData.get("recipientType") as string)?.trim() || "ALL";
  const isPinnedStr = (formData.get("isPinned") as string)?.trim();
  const allowRsvpStr = (formData.get("allowRsvp") as string)?.trim();
  const agmDateStr = (formData.get("agmDate") as string)?.trim();
  const agmLocation = (formData.get("agmLocation") as string)?.trim() || null;
  const expiresAtStr = (formData.get("expiresAt") as string)?.trim();

  if (!title || title.length < 3) return { error: "Title must be at least 3 characters." };
  if (!message || message.length < 10) return { error: "Message must be at least 10 characters." };
  if (!VALID_TYPES.includes(type as typeof VALID_TYPES[number])) {
    return { error: "Invalid announcement type." };
  }
  if (!VALID_RECIPIENT_TYPES.includes(recipientType as typeof VALID_RECIPIENT_TYPES[number])) {
    return { error: "Invalid recipient type." };
  }

  const isPinned = isPinnedStr !== "false";
  const allowRsvp = allowRsvpStr === "true";
  const agmDate = agmDateStr ? new Date(agmDateStr) : null;
  const expiresAt = expiresAtStr ? new Date(expiresAtStr) : null;

  const announcement = await prisma.announcement.create({
    data: {
      cooperativeId,
      title,
      message,
      type,
      recipientType,
      isPinned,
      allowRsvp,
      agmDate,
      agmLocation,
      expiresAt,
      isActive: true,
      createdBy: session.user.id,
    },
  });

  await prisma.event.create({
    data: {
      cooperativeId,
      eventType: "announcement_created",
      actorId: session.user.id,
      actorType: "admin",
      entityType: "announcement",
      data: { announcementId: announcement.id, title, type },
    },
  });

  notifyAnnouncement(announcement.id, cooperativeId).catch(() => {});

  revalidatePath("/admin/announcements");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deactivateAnnouncement(
  _prev: AnnouncementActionState,
  formData: FormData
): Promise<AnnouncementActionState> {
  const cooperativeId = (formData.get("cooperativeId") as string)?.trim();
  const announcementId = (formData.get("announcementId") as string)?.trim();
  if (!cooperativeId || !announcementId) return { error: "Missing required fields." };

  const session = await protectAdminAction(cooperativeId);

  const announcement = await prisma.announcement.findUnique({
    where: { id: announcementId },
  });
  if (!announcement || announcement.cooperativeId !== cooperativeId) {
    return { error: "Announcement not found." };
  }

  await prisma.announcement.update({
    where: { id: announcementId },
    data: { isActive: false },
  });

  revalidatePath("/admin/announcements");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function rsvpAnnouncement(
  _prev: AnnouncementActionState,
  formData: FormData
): Promise<AnnouncementActionState> {
  const session = await requireAuth();
  const userId = session.user.id;

  const announcementId = (formData.get("announcementId") as string)?.trim();
  const rsvpStatus = (formData.get("rsvpStatus") as string)?.trim();

  if (!announcementId || !rsvpStatus) return { error: "Missing required fields." };
  if (!VALID_RSVP_STATUSES.includes(rsvpStatus as typeof VALID_RSVP_STATUSES[number])) {
    return { error: "Invalid RSVP status." };
  }

  await prisma.announcementRsvp.upsert({
    where: { announcementId_userId: { announcementId, userId } },
    create: { announcementId, userId, rsvpStatus },
    update: { rsvpStatus },
  });

  revalidatePath(`/dashboard/announcements/${announcementId}`);
  return { success: true };
}
