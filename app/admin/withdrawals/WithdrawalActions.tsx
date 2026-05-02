"use client";

import { useActionState, useState } from "react";
import {
  approveWithdrawal,
  rejectWithdrawal,
  markWithdrawalPaid,
  type WithdrawalActionState,
} from "@/app/actions/withdrawals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ApproveForm({ withdrawalId }: { withdrawalId: string }) {
  const [state, action, pending] = useActionState<WithdrawalActionState, FormData>(
    approveWithdrawal,
    {}
  );

  return (
    <form action={action}>
      <input type="hidden" name="withdrawalId" value={withdrawalId} />
      {state.error && (
        <p className="text-xs text-red-600 dark:text-red-400 mb-1">{state.error}</p>
      )}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Approving…" : "Approve"}
      </Button>
    </form>
  );
}

export function RejectForm({ withdrawalId }: { withdrawalId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<WithdrawalActionState, FormData>(
    rejectWithdrawal,
    {}
  );

  if (!open) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900 dark:hover:bg-red-950"
        onClick={() => setOpen(true)}
      >
        Reject
      </Button>
    );
  }

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="withdrawalId" value={withdrawalId} />
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-1">
        <Label htmlFor={`reason-${withdrawalId}`} className="text-xs">
          Rejection reason
        </Label>
        <Input
          id={`reason-${withdrawalId}`}
          name="rejectionReason"
          placeholder="e.g. Active loan balance"
          required
          className="h-8 text-sm"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" variant="destructive" disabled={pending}>
          {pending ? "Rejecting…" : "Confirm"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function MarkPaidForm({ withdrawalId }: { withdrawalId: string }) {
  const [state, action, pending] = useActionState<WithdrawalActionState, FormData>(
    markWithdrawalPaid,
    {}
  );

  return (
    <form action={action}>
      <input type="hidden" name="withdrawalId" value={withdrawalId} />
      {state.error && (
        <p className="text-xs text-red-600 dark:text-red-400 mb-1">{state.error}</p>
      )}
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Processing…" : "Mark Paid"}
      </Button>
    </form>
  );
}
