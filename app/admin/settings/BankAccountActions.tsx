"use client";

import { useActionState } from "react";
import {
  deleteBankAccount,
  setPreferredBankAccount,
  type SettingsActionState,
} from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form } from "@/components/ui/form";

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
    <Form action={action}>
      <Input type="hidden" name="accountId" value={accountId} />
      <Input type="hidden" name="cooperativeId" value={cooperativeId} />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "…" : "Set preferred"}
      </Button>
    </Form>
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
    <Form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Delete this bank account?")) e.preventDefault();
      }}
    >
      <Input type="hidden" name="accountId" value={accountId} />
      <Input type="hidden" name="cooperativeId" value={cooperativeId} />
      <Button type="submit" size="sm" variant="destructive" disabled={pending}>
        {pending ? "…" : "Delete"}
      </Button>
    </Form>
  );
}
