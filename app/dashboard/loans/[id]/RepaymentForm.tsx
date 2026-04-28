"use client";

import { useActionState } from "react";
import { repayLoan, recordRepaymentForMember } from "@/app/actions/loans";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  loanId: string;
  remaining: number;
  currencySymbol: string;
  adminMode?: boolean;
};

export function RepaymentForm({ loanId, remaining, currencySymbol, adminMode }: Props) {
  const action = adminMode ? recordRepaymentForMember : repayLoan;
  const [state, formAction, pending] = useActionState(action, {});

  if (state.success) {
    return (
      <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
        Payment recorded successfully.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="loanId" value={loanId} />

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Remaining balance:{" "}
        <strong className="text-zinc-700 dark:text-zinc-300">
          {currencySymbol}{remaining.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
        </strong>
      </p>

      {adminMode ? (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="amount">Payment Amount</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              max={remaining}
              placeholder="0.00"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note">Note (optional)</Label>
            <Input
              id="note"
              name="note"
              type="text"
              placeholder="e.g. Cash payment received"
            />
          </div>
        </>
      ) : (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="loanAmount">Loan Repayment</Label>
            <Input
              id="loanAmount"
              name="loanAmount"
              type="number"
              step="0.01"
              min="0"
              max={remaining}
              placeholder="0.00"
            />
            <p className="text-xs text-zinc-400 dark:text-zinc-600">Amount to apply toward this loan</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contributionAmount">Monthly Contribution (optional)</Label>
            <Input
              id="contributionAmount"
              name="contributionAmount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
            />
            <p className="text-xs text-zinc-400 dark:text-zinc-600">
              Contribution will be recorded as verified immediately
            </p>
          </div>
        </>
      )}

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Recording…" : "Record Payment"}
      </Button>
    </form>
  );
}
