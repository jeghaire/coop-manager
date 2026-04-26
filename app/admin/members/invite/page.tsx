import { getSession } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { InviteMemberForm } from "./InviteMemberForm";

export default async function InviteMemberPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  const role = session.user.role as string;
  if (role !== "ADMIN" && role !== "OWNER") redirect("/dashboard");

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link
          href="/admin/members"
          className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
        >
          ← Back to Members
        </Link>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight mt-3">
          Invite a Member
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Create an account for a new cooperative member. They&apos;ll receive a
          temporary password by email.
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-6">
        <InviteMemberForm isOwner={role === "OWNER"} />
      </div>
    </div>
  );
}
