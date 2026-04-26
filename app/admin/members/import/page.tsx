import { getSession } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CSVImportForm } from "./CSVImportForm";

export default async function ImportMembersPage() {
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
          Import Members via CSV
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Bulk-create member accounts. Each member will receive an invite email
          with a temporary password.
        </p>
      </div>

      {/* Format guide */}
      <div className="mb-6 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4">
        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
          Expected Format
        </p>
        <pre className="text-xs font-mono text-zinc-700 dark:text-zinc-300 leading-relaxed">
          {`name,email,monthly_amount\nChioma Obi,chioma@example.com,10000\nEmeka Nwosu,emeka@example.com,15000`}
        </pre>
        <ul className="mt-3 space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
          <li>• Header row is optional</li>
          <li>• <code className="font-mono">monthly_amount</code> is optional, defaults to 0</li>
          <li>• Existing emails are skipped, not overwritten</li>
          <li>• All imported members get the <strong>Member</strong> role</li>
        </ul>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-6">
        <CSVImportForm />
      </div>
    </div>
  );
}
