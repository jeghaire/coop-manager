"use client";

import { useActionState } from "react";
import {
  approveDividendPayout,
  processDividendPayout,
  type DividendActionState,
} from "@/app/actions/dividends";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form } from "@/components/ui/form";

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
    <Form action={action}>
      <Input type="hidden" name="payoutId" value={payoutId} />
      <Input type="hidden" name="cooperativeId" value={cooperativeId} />
      {state.error && <p className="text-xs text-red-500 mb-1">{state.error}</p>}
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Approving…" : "Approve"}
      </Button>
    </Form>
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
    <Form action={action}>
      <Input type="hidden" name="payoutId" value={payoutId} />
      <Input type="hidden" name="cooperativeId" value={cooperativeId} />
      {state.error && (
        <Alert variant="destructive" className="mb-2">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Processing…" : "Pay Out"}
      </Button>
    </Form>
  );
}
