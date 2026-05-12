"use client";

import { useState } from "react";
import { useActionState } from "react";
import { recordContributionForMember } from "@/app/actions/contributions";
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

type Member = { id: string; name: string; email: string };

type Props = {
  members: Member[];
  currencySymbol: string;
};

export function RecordContributionForm({ members, currencySymbol }: Props) {
  const [state, formAction, pending] = useActionState(recordContributionForMember, {});
  const [memberId, setMemberId] = useState("");

  return (
    <Form action={formAction} className="space-y-4">
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
        <Input type="hidden" name="memberId" value={memberId} />
        <Select value={memberId} onValueChange={(v) => setMemberId(v ?? "")}>
          <SelectTrigger id="memberId" className="w-full">
            <SelectValue placeholder="Select a member…">
              {(value: string) => {
                const m = members.find((m) => m.id === value);
                return m ? `${m.name} (${m.email})` : null;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name} ({m.email})
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

      <Button type="submit" size="sm" disabled={pending || !memberId}>
        {pending ? "Recording…" : "Record Contribution"}
      </Button>
    </Form>
  );
}
