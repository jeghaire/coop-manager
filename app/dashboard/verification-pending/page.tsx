export const dynamic = "force-dynamic";

import { getSession } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default async function VerificationPendingPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      verifiedAt: true,
      cooperative: { select: { name: true } },
    },
  });

  if (!user) redirect("/auth/signin");

  // If already verified, send them to the dashboard
  if (user.verifiedAt) redirect("/dashboard");

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Awaiting Verification
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Your account is pending approval from your cooperative owner.
        </p>
      </div>

      <Alert>
        <AlertDescription>
          Your account is awaiting owner approval. You&apos;ll gain full access once a cooperative owner verifies your membership.
        </AlertDescription>
      </Alert>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
          Your Details
        </h2>
        <dl className="space-y-3">
          <div className="flex justify-between text-sm">
            <dt className="text-zinc-500 dark:text-zinc-400">Name</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100">{user.name}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-zinc-500 dark:text-zinc-400">Email</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100">{user.email}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-zinc-500 dark:text-zinc-400">Cooperative</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100">{user.cooperative.name}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-zinc-500 dark:text-zinc-400">Status</dt>
            <dd className="text-amber-600 dark:text-amber-400 font-medium">Pending Verification</dd>
          </div>
        </dl>
      </div>

      <p className="text-xs text-zinc-400 dark:text-zinc-600">
        You can still view your{" "}
        <a href="/dashboard/profile" className="underline hover:text-zinc-700 dark:hover:text-zinc-300">
          profile
        </a>{" "}
        and{" "}
        <a href="/dashboard/cooperative-details" className="underline hover:text-zinc-700 dark:hover:text-zinc-300">
          cooperative details
        </a>{" "}
        while you wait.
      </p>
    </div>
  );
}
