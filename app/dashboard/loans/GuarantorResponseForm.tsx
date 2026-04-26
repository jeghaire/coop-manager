"use client";

import { useActionState, useState } from "react";
import { respondAsGuarantor, type LoanActionState } from "@/app/actions/loans";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function GuarantorResponseForm({ loanId }: { loanId: string }) {
  const [state, action, pending] = useActionState<LoanActionState, FormData>(
    respondAsGuarantor,
    {}
  );
  const [choice, setChoice] = useState<"ACCEPTED" | "REJECTED" | null>(null);

  if (state.success) {
    return (
      <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
        Response submitted successfully.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="loanId" value={loanId} />
      <input type="hidden" name="response" value={choice ?? ""} />

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {choice === "REJECTED" && (
        <Textarea
          name="rejectionReason"
          placeholder="Reason for rejecting (required)"
          required
          className="text-sm"
          rows={2}
        />
      )}

      <div className="flex gap-2">
        <Button
          type={choice === "ACCEPTED" ? "submit" : "button"}
          size="sm"
          variant={choice === "ACCEPTED" ? "default" : "outline"}
          onClick={() => setChoice("ACCEPTED")}
          disabled={pending}
        >
          {pending && choice === "ACCEPTED" ? "Submitting…" : "Accept"}
        </Button>
        <Button
          type={choice === "REJECTED" ? "submit" : "button"}
          size="sm"
          variant={choice === "REJECTED" ? "destructive" : "outline"}
          onClick={() => choice !== "REJECTED" && setChoice("REJECTED")}
          disabled={pending}
        >
          {pending && choice === "REJECTED" ? "Submitting…" : "Decline"}
        </Button>
        {choice !== null && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setChoice(null)}
            disabled={pending}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
