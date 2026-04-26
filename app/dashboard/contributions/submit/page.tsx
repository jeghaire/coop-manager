import Link from "next/link";
import { ContributionSubmitForm } from "./ContributionSubmitForm";
import { getSession } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";

export default async function SubmitContributionPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link
          href="/dashboard/contributions"
          className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
        >
          ← Back to Contributions
        </Link>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight mt-3">
          Submit a Contribution
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Record a payment you&apos;ve made. An admin will verify it against
          your receipt.
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-6">
        <ContributionSubmitForm />
      </div>
    </div>
  );
}
