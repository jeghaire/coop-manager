export const dynamic = "force-dynamic";

import { getSession } from "@/app/lib/auth-helpers";
import { redirect, notFound } from "next/navigation";
import prisma from "@/app/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { RsvpForm } from "./RsvpForm";

const TYPE_BADGE: Record<string, "sky" | "warning" | "destructive" | "secondary"> = {
  AGM: "sky",
  MAINTENANCE: "warning",
  RULE_CHANGE: "destructive",
  GENERAL: "secondary",
};

export default async function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  const cooperativeId = session.user.cooperativeId as string;
  const userId = session.user.id;

  const [announcement, existingRsvp, rsvpCounts] = await Promise.all([
    prisma.announcement.findUnique({ where: { id } }),
    prisma.announcementRsvp.findUnique({
      where: { announcementId_userId: { announcementId: id, userId } },
      select: { rsvpStatus: true },
    }),
    prisma.announcementRsvp.count({ where: { announcementId: id } }),
  ]);

  if (!announcement || announcement.cooperativeId !== cooperativeId) {
    notFound();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge variant={TYPE_BADGE[announcement.type] ?? "secondary"}>
            {announcement.type}
          </Badge>
          {announcement.isPinned && <Badge variant="outline">Pinned</Badge>}
        </div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          {announcement.title}
        </h1>
        <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">
          {new Date(announcement.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-6 space-y-4">
        <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
          {announcement.message}
        </p>

        {announcement.type === "AGM" && (announcement.agmDate || announcement.agmLocation) && (
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-2">
              AGM Details
            </p>
            {announcement.agmDate && (
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                <span className="font-medium">Date: </span>
                {new Date(announcement.agmDate).toLocaleString()}
              </p>
            )}
            {announcement.agmLocation && (
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                <span className="font-medium">Location: </span>
                {announcement.agmLocation}
              </p>
            )}
          </div>
        )}
      </div>

      {announcement.allowRsvp && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Your RSVP
            </p>
            <span className="text-xs text-zinc-400 dark:text-zinc-600">
              {rsvpCounts} response{rsvpCounts !== 1 ? "s" : ""}
            </span>
          </div>
          <RsvpForm
            announcementId={announcement.id}
            currentStatus={existingRsvp?.rsvpStatus ?? null}
          />
        </div>
      )}
    </div>
  );
}
