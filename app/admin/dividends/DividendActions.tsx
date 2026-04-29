"use client";

import { useActionState } from "react";
import {
  approveDividendPayout,
  processDividendPayout,
  type DividendActionState,
} from "@/app/actions/dividends";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ApproveButton({
  payoutId,
  cooperativeId,
}: {
  payoutId: string;
  cooperativeId: string;
}) {
  const [state, action, pending] = useActionState<DividendActionState, FormData>(
    approveDividendPayout,
    {}
  );
  return (
    <form action={action}>
      <input type="hidden" name="payoutId" value={payoutId} />
      <input type="hidden" name="cooperativeId" value={cooperativeId} />
      {state.error && <p className="text-xs text-red-500 mb-1">{state.error}</p>}
      <Button size="sm" variant="outline" disabled={pending}>
        {pending ? "Approving…" : "Approve"}
      </Button>
    </form>
  );
}

export function ProcessButton({
  payoutId,
  cooperativeId,
}: {
  payoutId: string;
  cooperativeId: string;
}) {
  const [state, action, pending] = useActionState<DividendActionState, FormData>(
    processDividendPayout,
    {}
  );
  return (
    <form action={action}>
      <input type="hidden" name="payoutId" value={payoutId} />
      <input type="hidden" name="cooperativeId" value={cooperativeId} />
      {state.error && (
        <Alert variant="destructive" className="mb-2">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <Button size="sm" disabled={pending}>
        {pending ? "Processing…" : "Pay Out"}
      </Button>
    </form>
  );
}
