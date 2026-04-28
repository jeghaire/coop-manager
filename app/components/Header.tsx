import { getSession } from "@/app/lib/auth-helpers";
import { Building2, LogIn } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

export async function Header() {
  const session = await getSession();
  const user = session?.user;
  const role = (user?.role as string) ?? "MEMBER";

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#0c0c0c]/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/60">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href={user ? "/dashboard" : "/"}
          className="flex items-center gap-2.5 group shrink-0"
        >
          <div className="w-7 h-7 bg-emerald-600 dark:bg-emerald-500 rounded-md flex items-center justify-center shadow-sm group-hover:bg-emerald-700 dark:group-hover:bg-emerald-400 transition-colors">
            <Building2 className="w-4 h-4 text-white" strokeWidth={1.75} />
          </div>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight text-base">
            Cooperative Manager
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {user ? (
            <UserMenu name={user.name} email={user.email} role={role} />
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="hidden md:inline-flex text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors px-3 py-1.5"
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="hidden md:inline-flex text-sm font-medium bg-emerald-600 dark:bg-emerald-500 text-white px-4 py-1.5 rounded-md hover:bg-emerald-700 dark:hover:bg-emerald-400 transition-colors shadow-sm"
              >
                Get started
              </Link>
              <Link
                href="/auth/signin"
                className="md:hidden p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                aria-label="Sign in"
              >
                <LogIn className="w-5 h-5" strokeWidth={1.75} />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
