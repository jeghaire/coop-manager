import { getSession } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";
import { Header } from "@/app/components/Header";
import { DashboardNav } from "@/app/components/DashboardNav";
import prisma from "@/app/lib/prisma";
import { PinnedAnnouncementsBanner } from "@/components/PinnedAnnouncementsBanner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const role = session.user.role as string;
  const cooperativeId = session.user.cooperativeId as string;

  const [pendingLoans, pinnedAnnouncements] = await Promise.all([
    role === "ADMIN" || role === "OWNER"
      ? prisma.loanApplication.count({
          where: { cooperativeId, status: "PENDING_ADMIN_REVIEW", deletedAt: null },
        })
      : Promise.resolve(0),
    prisma.announcement.findMany({
      where: {
        cooperativeId,
        isActive: true,
        isPinned: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: { id: true, title: true, message: true, type: true, agmDate: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0c0c0c]">
      <Header pendingLoans={pendingLoans} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex gap-8">
        <aside className="hidden md:block w-48 shrink-0">
          <DashboardNav role={role} pendingLoans={pendingLoans} />
        </aside>
        <main className="flex-1 min-w-0">
          <PinnedAnnouncementsBanner announcements={pinnedAnnouncements} />
          {children}
        </main>
      </div>
    </div>
  );
}
