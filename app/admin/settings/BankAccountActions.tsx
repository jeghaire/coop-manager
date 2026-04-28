"use client";

import { useActionState } from "react";
import {
  deleteBankAccount,
  setPreferredBankAccount,
  type SettingsActionState,
} from "@/app/actions/settings";
import { Button } from "@/components/ui/button";

export function SetPreferredForm({
  accountId,
  cooperativeId,
}: {
  accountId: string;
  cooperativeId: string;
}) {
  const [, action, pending] = useActionState<SettingsActionState, FormData>(
    setPreferredBankAccount,
    {}
  );

  return (
    <form action={action}>
      <input type="hidden" name="accountId" value={accountId} />
      <input type="hidden" name="cooperativeId" value={cooperativeId} />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "…" : "Set preferred"}
      </Button>
    </form>
  );
}

export function DeleteBankAccountForm({
  accountId,
  cooperativeId,
}: {
  accountId: string;
  cooperativeId: string;
}) {
  const [, action, pending] = useActionState<SettingsActionState, FormData>(
    deleteBankAccount,
    {}
  );

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Delete this bank account?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="accountId" value={accountId} />
      <input type="hidden" name="cooperativeId" value={cooperativeId} />
      <Button type="submit" size="sm" variant="destructive" disabled={pending}>
        {pending ? "…" : "Delete"}
      </Button>
    </form>
  );
}
