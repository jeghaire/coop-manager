"use client";

import { useActionState } from "react";
import { recordContributionForMember } from "@/app/actions/contributions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Member = { id: string; name: string; email: string };

type Props = {
  members: Member[];
  currencySymbol: string;
};

export function RecordContributionForm({ members, currencySymbol }: Props) {
  const [state, formAction, pending] = useActionState(recordContributionForMember, {});

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.success && (
        <Alert>
          <AlertDescription>Contribution recorded and verified.</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="memberId">Member</Label>
        <select
          id="memberId"
          name="memberId"
          required
          className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Select a member…</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.email})
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
        <p className="text-xs text-zinc-400 dark:text-zinc-600">
          Recorded as verified — no approval needed
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="note">Note (optional)</Label>
        <Input
          id="note"
          name="note"
          type="text"
          placeholder="e.g. January 2026 contribution"
        />
      </div>

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Recording…" : "Record Contribution"}
      </Button>
    </form>
  );
}
