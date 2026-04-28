"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ArrowLeftToLine, Settings } from "lucide-react";
import { signOut } from "@/app/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";

const roleColor: Record<string, string> = {
  OWNER: "text-emerald-600 dark:text-emerald-400",
  ADMIN: "text-sky-600 dark:text-sky-400",
  TREASURER: "text-amber-600 dark:text-amber-400",
  MEMBER: "text-zinc-500 dark:text-zinc-400"
};

export function UserMenu({
  name,
  email,
  role
}: {
  name: string;
  email: string;
  role: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  async function handleSignOut() {
    setOpen(false);
    await signOut({
      fetchOptions: { onSuccess: () => router.push("/auth/signin") }
    });
  }

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 leading-none">
            {initials}
          </span>
        </div>
        <span className="hidden sm:block text-sm font-medium text-zinc-700 dark:text-zinc-300 leading-none">
          {name.split(" ")[0]}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          strokeWidth={2.5}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] w-60 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/60 rounded-xl shadow-xl shadow-black/10 dark:shadow-black/40 overflow-hidden z-50">
          {/* Account info */}
          <div className="px-4 py-3.5 border-b border-zinc-100 dark:border-zinc-800">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate leading-snug">
              {name}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 truncate mt-0.5">
              {email}
            </p>
            <span
              className={`text-[11px] font-mono font-semibold mt-1.5 inline-block ${roleColor[role] ?? roleColor.MEMBER}`}
            >
              {role}
            </span>
          </div>

          {/* Actions */}
          <div className="py-1">
            <Link
              href="/dashboard/settings"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <Settings className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              Account Settings
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors text-left"
            >
              <ArrowLeftToLine className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
