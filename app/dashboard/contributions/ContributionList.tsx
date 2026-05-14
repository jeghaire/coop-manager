"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { ReceiptViewerDialog } from "@/app/components/ReceiptViewerDialog";
import {
  loadMoreContributions,
  type ContributionItem,
} from "@/app/actions/contributions";

const PAGE_SIZE = 6;

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  BANK_TRANSFER: "Bank Transfer",
  MOBILE_MONEY: "Mobile Money",
  CASH: "Cash",
  DIRECT_PAYMENT: "Direct Payment",
};

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "PENDING_VERIFICATION":
      return <Badge variant="warning">Pending</Badge>;
    case "VERIFIED":
      return <Badge variant="success">Verified</Badge>;
    case "REJECTED":
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function ContributionCard({
  item,
  currencySymbol,
}: {
  item: ContributionItem;
  currencySymbol: string;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {currencySymbol}
              {item.amount.toLocaleString()}
            </span>
            <StatusBadge status={item.status} />
            <span className="text-xs text-muted-foreground">
              {PAYMENT_METHOD_LABEL[item.paymentMethod] ?? item.paymentMethod}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Submitted{" "}
            {new Date(item.submittedAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
          {item.receiptUrl && (
            <ReceiptViewerDialog
              url={item.receiptUrl}
              fileType={item.receiptFileType}
              fileName={item.receiptFileName}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline mt-1 inline-block"
            >
              View receipt
            </ReceiptViewerDialog>
          )}
          {item.status === "REJECTED" && item.rejectionReason && (
            <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
              Reason: {item.rejectionReason}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function ContributionList({
  initialItems,
  initialHasMore,
  currencySymbol,
}: {
  initialItems: ContributionItem[];
  initialHasMore: boolean;
  currencySymbol: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);

  const itemsRef = useRef(initialItems);
  const hasMoreRef = useRef(initialHasMore);
  const isLoadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);

  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMoreRef.current) return;
    const current = itemsRef.current;
    const last = current[current.length - 1];
    if (!last) return;

    isLoadingRef.current = true;
    setIsLoading(true);

    try {
      const more = await loadMoreContributions({
        submittedAt: last.submittedAt,
        id: last.id,
      });
      const batch = more.slice(0, PAGE_SIZE);
      hasMoreRef.current = more.length > PAGE_SIZE;
      setHasMore(more.length > PAGE_SIZE);
      setItems((prev) => [...prev, ...batch]);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreRef.current();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="space-y-3">
      {items.map((c) => (
        <ContributionCard key={c.id} item={c} currencySymbol={currencySymbol} />
      ))}

      <div ref={sentinelRef} className="h-1" />

      {isLoading && (
        <div className="py-4 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      )}

      {!hasMore && items.length >= PAGE_SIZE && (
        <p className="py-2 text-center text-xs text-muted-foreground">
          All contributions loaded
        </p>
      )}
    </div>
  );
}
