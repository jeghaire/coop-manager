"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/app/lib/auth-client";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await signOut({
      fetchOptions: {
        onSuccess: () => router.push("/auth/signin")
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 px-2.5 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
    >
      <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
      <span className="hidden sm:inline">Sign out</span>
    </button>
  );
}
