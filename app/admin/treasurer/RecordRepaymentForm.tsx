"use client";

import { useActionState } from "react";
import { recordRepaymentForMember } from "@/app/actions/loans";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Loan = {
  id: string;
  amountRequested: unknown;
  remaining: number;
  applicant: { name: string };
};

type Props = {
  loans: Loan[];
  currencySymbol: string;
};

export function RecordRepaymentForm({ loans, currencySymbol }: Props) {
  const [state, formAction, pending] = useActionState(recordRepaymentForMember, {});

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.success && (
        <Alert>
          <AlertDescription>Repayment recorded successfully.</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="loanId">Active Loan</Label>
        <select
          id="loanId"
          name="loanId"
          required
          className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Select a loan…</option>
          {loans.map((loan) => (
            <option key={loan.id} value={loan.id}>
              {loan.applicant.name} — {currencySymbol}
              {Number(loan.amountRequested).toLocaleString()} (
              {currencySymbol}
              {loan.remaining.toLocaleString(undefined, { maximumFractionDigits: 2 })} remaining)
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="amount">Amount ({currencySymbol})</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
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
          placeholder="e.g. Bank transfer ref #12345"
        />
      </div>

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Recording…" : "Record Repayment"}
      </Button>
    </form>
  );
}
