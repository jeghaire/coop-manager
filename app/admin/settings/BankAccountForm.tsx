"use client";

import { useActionState, startTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v3";
import { addBankAccount, type SettingsActionState } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

const schema = z.object({
  accountName: z.string().min(1, "Account name is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  bankName: z.string().min(1, "Bank name is required"),
  isPreferred: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function BankAccountForm({ cooperativeId }: { cooperativeId: string }) {
  const [state, action, pending] = useActionState<SettingsActionState, FormData>(
    addBankAccount,
    {}
  );
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      accountName: "",
      accountNumber: "",
      bankName: "",
      isPreferred: false,
    },
  });

  function onSubmit(values: FormValues) {
    const fd = new FormData();
    fd.set("cooperativeId", cooperativeId);
    fd.set("accountName", values.accountName);
    fd.set("accountNumber", values.accountNumber);
    fd.set("bankName", values.bankName);
    if (values.isPreferred) fd.set("isPreferred", "on");
    startTransition(() => action(fd));
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        {state.success && (
          <Alert>
            <AlertDescription>Bank account added.</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="accountName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Main Savings" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accountNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Number</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 0123456789" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bankName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bank Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. First Bank" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isPreferred"
            render={({ field }) => (
              <FormItem className="flex items-end pb-0.5">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-700 dark:text-zinc-300">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  Mark as preferred
                </label>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Adding…" : "Add Bank Account"}
        </Button>
      </form>
    </Form>
  );
}
