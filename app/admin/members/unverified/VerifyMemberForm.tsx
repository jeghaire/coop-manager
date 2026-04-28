"use client";

import { useActionState, useState } from "react";
import { verifyMember, type VerificationActionState } from "@/app/actions/verification";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function VerifyMemberForm({
  memberId,
  memberName,
}: {
  memberId: string;
  memberName: string;
}) {
  const [state, action, pending] = useActionState<VerificationActionState, FormData>(
    verifyMember,
    {}
  );
  const [confirming, setConfirming] = useState(false);

  if (state.success) {
    return (
      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
        ✓ Verified
      </span>
    );
  }

  if (!confirming) {
    return (
      <Button size="sm" variant="outline" onClick={() => setConfirming(true)}>
        Verify
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {state.error && (
        <Alert variant="destructive" className="text-xs py-1 px-2">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <p className="text-xs text-zinc-600 dark:text-zinc-400 text-right">
        Verify {memberName}?
      </p>
      <form action={action} className="flex gap-2">
        <input type="hidden" name="memberId" value={memberId} />
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setConfirming(false)}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Verifying…" : "Confirm"}
        </Button>
      </form>
    </div>
  );
}
