"use client";

import { useActionState, useState } from "react";
import {
  deleteBankAccount,
  setPreferredBankAccount,
  type SettingsActionState,
} from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
      <Input type="hidden" name="accountId" value={accountId} />
      <Input type="hidden" name="cooperativeId" value={cooperativeId} />
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
  const [confirm, setConfirm] = useState(false);
  const [, action, pending] = useActionState<SettingsActionState, FormData>(
    deleteBankAccount,
    {}
  );

  if (!confirm) {
    return (
      <Button
        size="sm"
        variant="destructive"
        onClick={() => setConfirm(true)}
      >
        Delete
      </Button>
    );
  }

  return (
    <form action={action} className="flex items-center gap-2">
      <Input type="hidden" name="accountId" value={accountId} />
      <Input type="hidden" name="cooperativeId" value={cooperativeId} />
      <Button type="submit" size="sm" variant="destructive" disabled={pending}>
        {pending ? "Deleting…" : "Confirm"}
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setConfirm(false)}>
        Cancel
      </Button>
    </form>
  );
}
