"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type PaginationState,
} from "@tanstack/react-table";
import { cn } from "@/app/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
} from "lucide-react";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    headerClassName?: string;
    cellClassName?: string;
  }
}

export type SerializedAuditEvent = {
  id: string;
  timestamp: string;
  eventType: string;
  actorName: string | null;
  entityType: string | null;
  entityId: number | null;
};

function formatEventType(raw: string): string {
  return raw
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Colours keyed by the actual lowercase event types stored in the DB ───────

const EMERALD = {
  dot: "bg-emerald-500",
  badge:
    "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
};
const RED = {
  dot: "bg-red-500",
  badge:
    "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20",
};
const SKY = {
  dot: "bg-sky-500",
  badge:
    "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-500/20",
};
const AMBER = {
  dot: "bg-amber-500",
  badge:
    "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
};
const VIOLET = {
  dot: "bg-violet-500",
  badge:
    "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-500/20",
};
const DEFAULT_STYLE = {
  dot: "bg-zinc-400 dark:bg-zinc-600",
  badge:
    "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
};

const EVENT_TYPE_COLORS: Record<string, { dot: string; badge: string }> = {
  // Loans
  loan_application_submitted: SKY,
  loan_ready_for_review: SKY,
  loan_application_approved: EMERALD,
  loan_repayment_made: EMERALD,
  loan_repayment_recorded: EMERALD,
  guarantor_accepted: EMERALD,
  loan_application_rejected: RED,
  loan_auto_rejected: RED,
  guarantor_rejected: RED,
  // Contributions
  contribution_submitted: AMBER,
  contribution_recorded_by_treasurer: SKY,
  contribution_verified: EMERALD,
  contribution_rejected: RED,
  // Members
  member_invited: SKY,
  members_imported: SKY,
  member_verified: SKY,
  member_role_changed: AMBER,
  member_removed: RED,
  // Dividends
  dividend_payout_created: VIOLET,
  dividend_payout_approved: VIOLET,
  dividend_payout_processed: VIOLET,
  // Withdrawals
  withdrawal_requested: AMBER,
  withdrawal_approved: EMERALD,
  withdrawal_paid: EMERALD,
  withdrawal_rejected: RED,
};

// ─── Filter categories ────────────────────────────────────────────────────────

const FILTER_OPTIONS = [
  { label: "All", value: "" },
  { label: "Loans", value: "loans" },
  { label: "Contributions", value: "contributions" },
  { label: "Members", value: "members" },
  { label: "Dividends", value: "dividends" },
  { label: "Withdrawals", value: "withdrawals" },
];

const FILTER_GROUPS: Record<string, string[]> = {
  loans: [
    "loan_application_submitted",
    "loan_application_approved",
    "loan_application_rejected",
    "loan_auto_rejected",
    "loan_ready_for_review",
    "loan_repayment_made",
    "loan_repayment_recorded",
    "guarantor_accepted",
    "guarantor_rejected",
  ],
  contributions: [
    "contribution_submitted",
    "contribution_recorded_by_treasurer",
    "contribution_verified",
    "contribution_rejected",
  ],
  members: [
    "member_invited",
    "members_imported",
    "member_role_changed",
    "member_removed",
    "member_verified",
  ],
  dividends: [
    "dividend_payout_created",
    "dividend_payout_approved",
    "dividend_payout_processed",
  ],
  withdrawals: [
    "withdrawal_requested",
    "withdrawal_approved",
    "withdrawal_rejected",
    "withdrawal_paid",
  ],
};

const PAGE_SIZE_OPTIONS = [10, 20, 50];

// ─── Columns ──────────────────────────────────────────────────────────────────

const columns: ColumnDef<SerializedAuditEvent>[] = [
  {
    accessorKey: "timestamp",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 hover:text-foreground transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Timestamp
        <ArrowUpDown className="size-3 opacity-60" />
      </button>
    ),
    cell: ({ row }) => (
      <span className="text-xs text-zinc-500 dark:text-zinc-400">
        {new Date(row.original.timestamp).toLocaleString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    ),
    sortingFn: "alphanumeric",
  },
  {
    accessorKey: "eventType",
    header: "Action",
    cell: ({ row }) => {
      const style =
        EVENT_TYPE_COLORS[row.original.eventType] ?? DEFAULT_STYLE;
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap",
            style.badge,
          )}
        >
          <span
            className={cn("size-1.5 rounded-full shrink-0", style.dot)}
          />
          {formatEventType(row.original.eventType)}
        </span>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "actorName",
    header: "Actor",
    cell: ({ row }) =>
      row.original.actorName ? (
        <span className="text-zinc-700 dark:text-zinc-300">
          {row.original.actorName}
        </span>
      ) : (
        <span className="text-muted-foreground text-xs">System</span>
      ),
    enableSorting: false,
    meta: {
      headerClassName: "hidden sm:table-cell",
      cellClassName: "hidden sm:table-cell",
    },
  },
  {
    accessorKey: "entityType",
    header: "Entity",
    cell: ({ row }) => {
      const { entityType, entityId } = row.original;
      if (!entityType)
        return <span className="text-muted-foreground text-xs">—</span>;
      return (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {formatEventType(entityType)}
          {entityId != null && (
            <span className="text-muted-foreground"> #{entityId}</span>
          )}
        </span>
      );
    },
    enableSorting: false,
    meta: {
      headerClassName: "hidden md:table-cell",
      cellClassName: "hidden md:table-cell",
    },
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function AuditTrailTable({ events }: { events: SerializedAuditEvent[] }) {
  const [activeFilter, setActiveFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "timestamp", desc: true },
  ]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const filteredEvents = useMemo(() => {
    if (!activeFilter) return events;
    const group = FILTER_GROUPS[activeFilter] ?? [];
    return events.filter((e) => group.includes(e.eventType));
  }, [events, activeFilter]);

  const table = useReactTable({
    data: filteredEvents,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  function handleFilter(value: string) {
    setActiveFilter(value);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }

  function handlePageSize(e: React.ChangeEvent<HTMLSelectElement>) {
    setPagination({ pageIndex: 0, pageSize: Number(e.target.value) });
  }

  const { pageIndex } = table.getState().pagination;
  const pageCount = table.getPageCount();

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTER_OPTIONS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => handleFilter(value)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
              activeFilter === value
                ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40"
                : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600",
            )}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">
          {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
          {filteredEvents.length === 500 ? " (limit)" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={header.column.columnDef.meta?.headerClassName}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No audit events found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cell.column.columnDef.meta?.cellClassName}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer: page-size picker + pagination */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Rows per page</span>
          <select
            value={pagination.pageSize}
            onChange={handlePageSize}
            className="h-7 rounded-md border border-input bg-transparent px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring/50"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        {pageCount > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {pageIndex + 1} / {pageCount}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                aria-label="First page"
              >
                <ChevronsLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Next page"
              >
                <ChevronRight className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(pageCount - 1)}
                disabled={!table.getCanNextPage()}
                aria-label="Last page"
              >
                <ChevronsRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
