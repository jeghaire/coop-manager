import { getSession } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";
import { Header } from "@/app/components/Header";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const user = session.user;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0c0c0c]">
      <Header />

      <main className="max-w-6xl mx-auto py-14 px-6">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Dashboard
          </h1>
          <p className="text-base text-zinc-500 dark:text-zinc-400 mt-1.5">
            Welcome back, {user.name}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#0f0f0f] border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-6">
            <p className="text-xs font-mono font-medium text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-3">
              Role
            </p>
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{user.role}</p>
          </div>

          <div className="bg-white dark:bg-[#0f0f0f] border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-6">
            <p className="text-xs font-mono font-medium text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-3">
              Cooperative ID
            </p>
            <p className="text-base font-mono text-zinc-700 dark:text-zinc-300 truncate">{user.cooperativeId}</p>
          </div>

          <div className="bg-white dark:bg-[#0f0f0f] border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-6">
            <p className="text-xs font-mono font-medium text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-3">
              Email
            </p>
            <p className="text-base text-zinc-700 dark:text-zinc-300 truncate">{user.email}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
