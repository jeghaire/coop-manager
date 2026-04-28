import { getSession } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";
import { Header } from "@/app/components/Header";
import { DashboardNav } from "@/app/components/DashboardNav";
import { MobileNav } from "@/app/components/MobileNav";
import prisma from "@/app/lib/prisma";

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

  const pendingLoans =
    role === "ADMIN" || role === "OWNER"
      ? await prisma.loanApplication.count({
          where: { cooperativeId, status: "PENDING_ADMIN_REVIEW", deletedAt: null },
        })
      : 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0c0c0c]">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-8 flex gap-8">
        <aside className="hidden md:block w-48 shrink-0">
          <DashboardNav role={role} pendingLoans={pendingLoans} />
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
      <MobileNav role={role} />
    </div>
  );
}
