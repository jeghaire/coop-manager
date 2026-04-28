"use client";

import { useActionState } from "react";
import { updateLoanSettings } from "@/app/actions/settings";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  cooperativeId: string;
  interestRate: number;
  repaymentMonths: number;
  gracePeriodDays: number;
  currency: string;
  currencySymbol: string;
};

export function LoanSettingsForm({
  cooperativeId,
  interestRate,
  repaymentMonths,
  gracePeriodDays,
  currency,
  currencySymbol,
}: Props) {
  const [state, formAction, pending] = useActionState(updateLoanSettings, {});

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="cooperativeId" value={cooperativeId} />

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.success && (
        <Alert>
          <AlertDescription>Loan settings updated.</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="loanInterestRate">Interest Rate (%)</Label>
          <Input
            id="loanInterestRate"
            name="loanInterestRate"
            type="number"
            step="0.01"
            min="0"
            max="100"
            defaultValue={interestRate}
            required
          />
          <p className="text-xs text-zinc-400 dark:text-zinc-600">Simple interest applied at approval</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="loanRepaymentMonths">Repayment Period (months)</Label>
          <Input
            id="loanRepaymentMonths"
            name="loanRepaymentMonths"
            type="number"
            min="1"
            max="60"
            defaultValue={repaymentMonths}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="defaultGracePeriodDays">Grace Period (days)</Label>
          <Input
            id="defaultGracePeriodDays"
            name="defaultGracePeriodDays"
            type="number"
            min="0"
            defaultValue={gracePeriodDays}
            required
          />
          <p className="text-xs text-zinc-400 dark:text-zinc-600">Days past due before a loan is flagged as defaulted</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="currency">Currency Code</Label>
          <Input
            id="currency"
            name="currency"
            type="text"
            maxLength={10}
            defaultValue={currency}
            placeholder="NGN"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="currencySymbol">Currency Symbol</Label>
          <Input
            id="currencySymbol"
            name="currencySymbol"
            type="text"
            maxLength={5}
            defaultValue={currencySymbol}
            placeholder="₦"
            required
          />
        </div>
      </div>

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save Loan Settings"}
      </Button>
    </form>
  );
}
