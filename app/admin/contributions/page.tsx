export const dynamic = "force-dynamic";

import { getSession } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { ContributionReviewForm } from "./ContributionReviewForm";
import Link from "next/link";

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  BANK_TRANSFER: "Bank Transfer",
  MOBILE_MONEY: "Mobile Money",
  CASH: "Cash",
  DIRECT_PAYMENT: "Direct Payment",
};

const STATUS_FILTER = ["ALL", "PENDING_VERIFICATION", "VERIFIED", "REJECTED"] as const;
type StatusFilter = (typeof STATUS_FILTER)[number];

const STATUS_LABEL: Record<StatusFilter, string> = {
  ALL: "All",
  PENDING_VERIFICATION: "Pending",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
};

export default async function AdminContributionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  const role = session.user.role as string;
  if (role !== "ADMIN" && role !== "OWNER" && role !== "TREASURER") {
    redirect("/dashboard");
  }

  const cooperativeId = session.user.cooperativeId as string;
  const { status: rawStatus } = await searchParams;
  const activeFilter: StatusFilter =
    STATUS_FILTER.includes(rawStatus as StatusFilter)
      ? (rawStatus as StatusFilter)
      : "PENDING_VERIFICATION";

  const contributions = await prisma.contribution.findMany({
    where: {
      cooperativeId,
      deletedAt: null,
      ...(activeFilter !== "ALL" && { status: activeFilter }),
    },
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { submittedAt: "desc" },
  });

  const counts = await prisma.contribution.groupBy({
    by: ["status"],
    where: { cooperativeId, deletedAt: null },
    _count: true,
  });

  const countMap: Record<string, number> = { ALL: 0 };
  for (const row of counts) {
    countMap[row.status] = row._count;
    countMap.ALL = (countMap.ALL ?? 0) + row._count;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Member Contributions
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Review and verify member payment receipts
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {STATUS_FILTER.map((s) => (
          <Link
            key={s}
            href={`/admin/contributions?status=${s}`}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === s
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            {STATUS_LABEL[s]}
            {countMap[s] != null && (
              <span className="ml-1.5 text-xs opacity-70">
                {countMap[s]}
              </span>
            )}
          </Link>
        ))}
      </div>

      {contributions.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-10 text-center">
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            {activeFilter === "PENDING_VERIFICATION"
              ? "No contributions pending verification. All caught up!"
              : `No ${STATUS_LABEL[activeFilter].toLowerCase()} contributions.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {contributions.map((c) => (
            <div
              key={c.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                      ₦{Number(c.amount).toLocaleString()}
                    </span>
                    {c.status === "PENDING_VERIFICATION" && (
                      <Badge variant="warning">Pending</Badge>
                    )}
                    {c.status === "VERIFIED" && (
                      <Badge variant="success">Verified</Badge>
                    )}
                    {c.status === "REJECTED" && (
                      <Badge variant="destructive">Rejected</Badge>
                    )}
                    <span className="text-xs text-zinc-400 dark:text-zinc-600">
                      {PAYMENT_METHOD_LABEL[c.paymentMethod] ?? c.paymentMethod}
                    </span>
                  </div>

                  <div className="mt-2 space-y-0.5">
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {c.user.name}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {c.user.email}
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-600">
                      Submitted{" "}
                      {new Date(c.submittedAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  {c.receiptUrl && (
                    <div className="mt-2">
                      <a
                        href={c.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        {c.receiptFileType === "application/pdf" ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-4 h-4 shrink-0"
                          >
                            <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625z" />
                            <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
                          </svg>
                        ) : null}
                        View receipt ↗
                      </a>
                      {c.receiptFileType?.startsWith("image/") && (
                        <div className="mt-2">
                          <img
                            src={c.receiptUrl}
                            alt="Receipt"
                            className="max-h-30 rounded-lg border border-zinc-200 dark:border-zinc-700 object-contain"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {c.status === "REJECTED" && c.rejectionReason && (
                    <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                      <span className="font-medium">Rejection reason:</span>{" "}
                      {c.rejectionReason}
                    </p>
                  )}

                  {c.status === "VERIFIED" && c.verifiedAt && (
                    <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                      Verified{" "}
                      {new Date(c.verifiedAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
              </div>

              {c.status === "PENDING_VERIFICATION" && (
                <ContributionReviewForm contributionId={c.id} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
