"use client";

import { useActionState, useState } from "react";
import {
  verifyContribution,
  type ContributionActionState,
} from "@/app/actions/contributions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ContributionReviewForm({
  contributionId,
}: {
  contributionId: string;
}) {
  const [state, action, pending] = useActionState<
    ContributionActionState,
    FormData
  >(verifyContribution, {});
  const [decision, setDecision] = useState<"VERIFIED" | "REJECTED" | null>(
    null
  );

  if (state.success) {
    return (
      <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
        Decision recorded.
      </p>
    );
  }

  return (
    <form
      action={action}
      className="space-y-3 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800"
    >
      <input type="hidden" name="contributionId" value={contributionId} />
      <input type="hidden" name="decision" value={decision ?? ""} />

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {decision === "REJECTED" && (
        <Textarea
          name="rejectionReason"
          placeholder="Reason for rejection (required)"
          required
          rows={2}
          className="text-sm"
        />
      )}

      <div className="flex gap-2">
        <Button
          type={decision === "VERIFIED" ? "submit" : "button"}
          size="sm"
          variant={decision === "VERIFIED" ? "default" : "outline"}
          onClick={() => setDecision("VERIFIED")}
          disabled={pending}
        >
          {pending && decision === "VERIFIED" ? "Saving…" : "Verify"}
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
