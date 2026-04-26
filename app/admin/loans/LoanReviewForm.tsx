"use client";

import { useActionState, useState } from "react";
import { reviewLoan, type LoanActionState } from "@/app/actions/loans";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function LoanReviewForm({ loanId }: { loanId: string }) {
  const [state, action, pending] = useActionState<LoanActionState, FormData>(
    reviewLoan,
    {}
  );
  const [decision, setDecision] = useState<"APPROVED" | "REJECTED" | null>(null);

  if (state.success) {
    return (
      <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
        Decision recorded.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-3 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
      <input type="hidden" name="loanId" value={loanId} />
      <input type="hidden" name="decision" value={decision ?? ""} />

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {decision === "REJECTED" && (
        <Textarea
          name="reason"
          placeholder="Reason for rejection (required)"
          required
          rows={2}
          className="text-sm"
        />
      )}

      <div className="flex gap-2">
        <Button
          type={decision === "APPROVED" ? "submit" : "button"}
          size="sm"
          variant={decision === "APPROVED" ? "default" : "outline"}
          onClick={() => setDecision("APPROVED")}
          disabled={pending}
        >
          {pending && decision === "APPROVED" ? "Saving…" : "Approve"}
        </Button>
        <Button
          type={decision === "REJECTED" ? "submit" : "button"}
          size="sm"
          variant={decision === "REJECTED" ? "destructive" : "outline"}
          onClick={() => decision !== "REJECTED" && setDecision("REJECTED")}
          disabled={pending}
        >
          {pending && decision === "REJECTED" ? "Saving…" : "Reject"}
        </Button>
        {decision !== null && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setDecision(null)}
            disabled={pending}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
