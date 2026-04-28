"use client";

import { useActionState } from "react";
import { addBankAccount, type SettingsActionState } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function BankAccountForm({ cooperativeId }: { cooperativeId: string }) {
  const [state, action, pending] = useActionState<SettingsActionState, FormData>(
    addBankAccount,
    {}
  );

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="cooperativeId" value={cooperativeId} />

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.success && (
        <Alert>
          <AlertDescription>Bank account added.</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="accountName">Account Name</Label>
          <Input id="accountName" name="accountName" placeholder="e.g. Main Savings" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="accountNumber">Account Number</Label>
          <Input
            id="accountNumber"
            name="accountNumber"
            placeholder="e.g. 0123456789"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bankName">Bank Name</Label>
          <Input id="bankName" name="bankName" placeholder="e.g. First Bank" required />
        </div>
        <div className="flex items-end pb-0.5">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-700 dark:text-zinc-300">
            <input type="checkbox" name="isPreferred" className="rounded" />
            Mark as preferred
          </label>
        </div>
      </div>

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Adding…" : "Add Bank Account"}
      </Button>
    </form>
  );
}
