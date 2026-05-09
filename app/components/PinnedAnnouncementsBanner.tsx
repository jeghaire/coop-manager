"use client";

import { useState } from "react";
import { AlertCircle, X } from "lucide-react";

type PinnedAnnouncement = {
  id: string;
  title: string;
  message: string;
  type: string;
  agmDate: Date | null;
};

const TYPE_STYLES: Record<string, { wrapper: string; border: string }> = {
  AGM: {
    wrapper: "bg-green-50 dark:bg-green-950/40",
    border: "border-green-300 dark:border-green-700",
  },
  MAINTENANCE: {
    wrapper: "bg-yellow-50 dark:bg-yellow-950/40",
    border: "border-yellow-300 dark:border-yellow-700",
  },
  RULE_CHANGE: {
    wrapper: "bg-red-50 dark:bg-red-950/40",
    border: "border-red-300 dark:border-red-700",
  },
  GENERAL: {
    wrapper: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-300 dark:border-blue-700",
  },
};

const ICON_COLORS: Record<string, string> = {
  AGM: "text-green-600 dark:text-green-400",
  MAINTENANCE: "text-yellow-600 dark:text-yellow-400",
  RULE_CHANGE: "text-red-600 dark:text-red-400",
  GENERAL: "text-blue-600 dark:text-blue-400",
};

export function PinnedAnnouncementsBanner({
  announcements,
}: {
  announcements: PinnedAnnouncement[];
}) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = announcements.filter((a) => !dismissed.has(a.id));

  if (visible.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {visible.map((ann) => {
        const styles = TYPE_STYLES[ann.type] ?? TYPE_STYLES.GENERAL;
        const iconColor = ICON_COLORS[ann.type] ?? ICON_COLORS.GENERAL;

        return (
          <div
            key={ann.id}
            className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${styles.wrapper} ${styles.border}`}
          >
            <AlertCircle
              className={`mt-0.5 h-4 w-4 shrink-0 ${iconColor}`}
              aria-hidden
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                {ann.title}
              </p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 line-clamp-2 mt-0.5">
                {ann.message}
              </p>
              {ann.type === "AGM" && ann.agmDate && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {new Date(ann.agmDate).toLocaleString()}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setDismissed((prev) => new Set([...prev, ann.id]))}
              className="shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
