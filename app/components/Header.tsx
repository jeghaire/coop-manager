import { getSession } from "@/app/lib/auth-helpers";
import { Building2, LogOutIcon } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { MobileNavDrawer } from "./MobileNavDrawer";
import { Separator } from "@/components/ui/separator";
import UserMenu from "./UserMenu";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/app/lib/utils";
export async function Header({ pendingLoans = 0 }: { pendingLoans?: number }) {
  const session = await getSession();
  const user = session?.user;
  const role = (user?.role as string) ?? "MEMBER";

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#0c0c0c]/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 shrink-0">
          {user && <MobileNavDrawer role={role} pendingLoans={pendingLoans} />}
          <Link
            href={user ? "/dashboard" : "/"}
            className="flex items-center gap-2.5 group shrink-0"
          >
            <div className="w-7 h-7 bg-emerald-600 dark:bg-emerald-500 rounded-md flex items-center justify-center shadow-sm group-hover:bg-emerald-700 dark:group-hover:bg-emerald-400 transition-colors">
              <Building2 className="w-4 h-4 text-white" strokeWidth={1.75} />
            </div>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Cooperative Manager
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {!user && (
            <nav className="hidden md:flex items-center gap-1 mr-1">
              <a
                href="#how-it-works"
                className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors px-3 py-1.5"
              >
                How it works
              </a>
              <a
                href="#security"
                className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors px-3 py-1.5"
              >
                Security
              </a>
            </nav>
          )}
          <ThemeToggle />
          <Separator
            orientation="vertical"
            className="data-[orientation=vertical]:h-5 my-auto"
          />

          {user ? (
            <UserMenu
              user={{
                name: user.name,
                email: user.email,
                image: user.image ?? "",
                role: user.role,
              }}
            />
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
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "md:hidden text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors",
                )}
                aria-label="Sign in"
              >
                <LogOutIcon />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
