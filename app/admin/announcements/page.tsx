export const dynamic = "force-dynamic";

import { getSession } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { DeactivateButton } from "./DeactivateButton";

const TYPE_BADGE: Record<string, "sky" | "warning" | "destructive" | "secondary"> = {
  AGM: "sky",
  MAINTENANCE: "warning",
  RULE_CHANGE: "destructive",
  GENERAL: "secondary",
};

export default async function AdminAnnouncementsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  const role = session.user.role as string;
  if (role !== "ADMIN" && role !== "OWNER") redirect("/dashboard");

  const cooperativeId = session.user.cooperativeId as string;

  const announcements = await prisma.announcement.findMany({
    where: { cooperativeId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { rsvps: true } } },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Announcements
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {announcements.filter((a) => a.isActive).length} active ·{" "}
            {announcements.length} total
          </p>
        </div>
        <Link
          href="/admin/announcements/new"
          className={buttonVariants({ size: "sm" })}
        >
          New Announcement
        </Link>
      </div>

      {announcements.length === 0 && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-12 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No announcements yet
          </p>
        </div>
      )}

      <div className="space-y-3">
        {announcements.map((ann) => (
          <div
            key={ann.id}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {ann.title}
                  </span>
                  <Badge variant={TYPE_BADGE[ann.type] ?? "secondary"}>
                    {ann.type}
                  </Badge>
                  {ann.isPinned && (
                    <Badge variant="outline">Pinned</Badge>
                  )}
                  {!ann.isActive && (
                    <Badge variant="destructive">Inactive</Badge>
                  )}
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                  {ann.message}
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <span className="text-xs text-zinc-400 dark:text-zinc-600">
                    {new Date(ann.createdAt).toLocaleDateString()}
                  </span>
                  {ann.allowRsvp && (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {ann._count.rsvps} RSVP{ann._count.rsvps !== 1 ? "s" : ""}
                    </span>
                  )}
                  <span className="text-xs text-zinc-400 dark:text-zinc-600 uppercase">
                    {ann.recipientType}
                  </span>
                </div>
              </div>
              {ann.isActive && (
                <div className="shrink-0">
                  <DeactivateButton
                    announcementId={ann.id}
                    cooperativeId={cooperativeId}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
