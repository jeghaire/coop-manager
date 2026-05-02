"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  requestWithdrawal,
  type WithdrawalActionState,
} from "@/app/actions/withdrawals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const REASONS = [
  { value: "PERSONAL", label: "Personal Use" },
  { value: "EMERGENCY", label: "Emergency" },
  { value: "LEAVING", label: "Leaving Cooperative" },
  { value: "OTHER", label: "Other" },
] as const;

export function WithdrawalForm({
  maxAmount,
  currencySymbol,
}: {
  maxAmount: number;
  currencySymbol: string;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<WithdrawalActionState, FormData>(
    requestWithdrawal,
    {}
  );
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={action} className="space-y-5">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.success && (
        <Alert>
          <AlertDescription>
            Withdrawal request submitted. You will be notified when it&apos;s reviewed.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="amount">
          Amount ({currencySymbol})
        </Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          min="1"
          step="0.01"
          max={maxAmount}
          placeholder="0.00"
          required
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Maximum: {currencySymbol}{maxAmount.toLocaleString()}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reason">Reason</Label>
        <input type="hidden" name="reason" value={reason} />
        <Select value={reason} onValueChange={(v) => setReason(v ?? "")}>
          <SelectTrigger id="reason">
            <SelectValue placeholder="Select a reason" />
          </SelectTrigger>
          <SelectContent>
            {REASONS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">
          Notes{" "}
          <span className="text-zinc-400 dark:text-zinc-600 font-normal">
            (optional)
          </span>
        </Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Any additional context…"
          rows={3}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={pending || !reason}
      >
        {pending ? "Submitting…" : "Request Withdrawal"}
      </Button>
    </form>
  );
}
