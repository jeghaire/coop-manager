"use client";

import { useActionState, useEffect } from "react";
import {
  submitContribution,
  type ContributionActionState,
} from "@/app/actions/contributions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useRouter } from "next/navigation";

const PAYMENT_METHODS = [
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "MOBILE_MONEY", label: "Mobile Money" },
  { value: "CASH", label: "Cash" },
] as const;

export function ContributionSubmitForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState<
    ContributionActionState,
    FormData
  >(submitContribution, {});
  const [paymentMethod, setPaymentMethod] = useState("");

  useEffect(() => {
    if (state.success) {
      router.push("/dashboard/contributions");
    }
  }, [state.success, router]);

  return (
    <form action={action} className="space-y-5">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="amount">Amount (₦)</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          min="1"
          step="0.01"
          placeholder="e.g. 10000"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="paymentMethod">Payment Method</Label>
        <input type="hidden" name="paymentMethod" value={paymentMethod} />
        <Select
          value={paymentMethod}
          onValueChange={(v) => setPaymentMethod(v ?? "")}
        >
          <SelectTrigger id="paymentMethod">
            <SelectValue placeholder="How did you pay?" />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_METHODS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="receiptUrl">
          Receipt URL{" "}
          <span className="text-zinc-400 dark:text-zinc-600 font-normal">
            (optional)
          </span>
        </Label>
        <Input
          id="receiptUrl"
          name="receiptUrl"
          type="url"
          placeholder="https://drive.google.com/…"
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Upload your receipt to Google Drive, Dropbox, or similar and paste the
          link here.
        </p>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={pending || !paymentMethod}
      >
        {pending ? "Submitting…" : "Submit Contribution"}
      </Button>
    </form>
  );
}
