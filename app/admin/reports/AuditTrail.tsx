import { getAuditTrail } from "@/app/actions/reports";
import Link from "next/link";
import { cn } from "@/app/lib/utils";

function formatEventType(raw: string): string {
  return raw
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const EVENT_TYPE_COLORS: Record<
  string,
  { dot: string; badge: string }
> = {
  LOAN_APPROVED: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
  },
  LOAN_REJECTED: {
    dot: "bg-red-500",
    badge: "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20",
  },
  CONTRIBUTION_VERIFIED: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
  },
  CONTRIBUTION_REJECTED: {
    dot: "bg-red-500",
    badge: "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20",
  },
  MEMBER_VERIFIED: {
    dot: "bg-sky-500",
    badge: "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-500/20",
  },
  DIVIDEND_PAID: {
    dot: "bg-violet-500",
    badge: "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-500/20",
  },
};

function getEventStyle(eventType: string) {
  return (
    EVENT_TYPE_COLORS[eventType] ?? {
      dot: "bg-zinc-400 dark:bg-zinc-600",
      badge:
        "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
    }
  );
}

// ─── Filter tabs (URL-based) ──────────────────────────────────────────────────

const FILTER_OPTIONS = [
  { label: "All", value: "" },
  { label: "Loans", value: "LOAN_APPROVED" },
  { label: "Contributions", value: "CONTRIBUTION_VERIFIED" },
  { label: "Members", value: "MEMBER_VERIFIED" },
  { label: "Dividends", value: "DIVIDEND_PAID" },
];

export async function AuditTrail({
  cooperativeId,
  eventType,
}: {
  cooperativeId: string;
  eventType?: string;
}) {
  const events = await getAuditTrail(cooperativeId, {
    eventType: eventType || undefined,
  });

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map(({ label, value }) => {
          const isActive = (eventType ?? "") === value;
          return (
            <Link
              key={value}
              href={value ? `?tab=audit&eventType=${value}` : "?tab=audit"}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                isActive
                  ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
              )}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {/* Table */}
      {events.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-10 text-center">
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            No audit events found.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Audit Trail
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-600">
              {events.length} event{events.length !== 1 ? "s" : ""}
              {events.length === 500 ? " (limit)" : ""}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hidden sm:table-cell">
                    Actor
                  </th>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hidden md:table-cell">
                    Entity
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {events.map((event) => {
                  const style = getEventStyle(event.eventType);
                  return (
                    <tr
                      key={event.id}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20"
                    >
                      <td className="px-5 py-3 text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                        {new Date(event.timestamp).toLocaleString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
                            style.badge
                          )}
                        >
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full shrink-0",
                              style.dot
                            )}
                          />
                          {formatEventType(event.eventType)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 hidden sm:table-cell">
                        {event.actorName ?? (
                          <span className="text-zinc-400 dark:text-zinc-600">
                            System
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400 text-xs hidden md:table-cell">
                        {event.entityType ? (
                          <span>
                            {formatEventType(event.entityType)}
                            {event.entityId != null && (
                              <span className="text-zinc-400 dark:text-zinc-600">
                                {" "}
                                #{event.entityId}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-zinc-400 dark:text-zinc-600">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
