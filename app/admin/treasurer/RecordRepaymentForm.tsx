"use client";

import { useState } from "react";
import { useActionState } from "react";
import { recordRepaymentForMember } from "@/app/actions/loans";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form } from "@/components/ui/form";

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
  const [loanId, setLoanId] = useState("");

  return (
    <Form action={formAction} className="space-y-4">
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
        <Input type="hidden" name="loanId" value={loanId} />
        <Select value={loanId} onValueChange={(v) => setLoanId(v ?? "")}>
          <SelectTrigger id="loanId" className="w-full">
            <SelectValue placeholder="Select a loan…" />
          </SelectTrigger>
          <SelectContent>
            {loans.map((loan) => (
              <SelectItem key={loan.id} value={loan.id}>
                {loan.applicant.name} — {currencySymbol}
                {Number(loan.amountRequested).toLocaleString()} (
                {currencySymbol}
                {loan.remaining.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}{" "}
                remaining)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

      <Button type="submit" size="sm" disabled={pending || !loanId}>
        {pending ? "Recording…" : "Record Repayment"}
      </Button>
    </Form>
  );
}
