"use client";

import { useActionState, startTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v3";
import { repayLoan, recordRepaymentForMember } from "@/app/actions/loans";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";

const adminSchema = z.object({
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  note: z.string().optional(),
});

const memberSchema = z.object({
  loanAmount: z.coerce.number().min(0, "Must be 0 or more").optional(),
  contributionAmount: z.coerce.number().min(0, "Must be 0 or more").optional(),
});

type AdminValues = z.infer<typeof adminSchema>;
type MemberValues = z.infer<typeof memberSchema>;

type Props = {
  loanId: string;
  remaining: number;
  currencySymbol: string;
  adminMode?: boolean;
};

function AdminRepaymentForm({ loanId, remaining, currencySymbol }: Omit<Props, "adminMode">) {
  const [state, formAction, pending] = useActionState(recordRepaymentForMember, {});
  const form = useForm<AdminValues>({
    resolver: zodResolver(adminSchema),
    defaultValues: { amount: undefined, note: "" },
  });

  if (state.success) {
    return (
      <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
        Payment recorded successfully.
      </p>
    );
  }

  function onSubmit(values: AdminValues) {
    const fd = new FormData();
    fd.set("loanId", loanId);
    fd.set("amount", String(values.amount));
    if (values.note) fd.set("note", values.note);
    startTransition(() => formAction(fd));
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Remaining balance:{" "}
          <strong className="text-zinc-700 dark:text-zinc-300">
            {currencySymbol}{remaining.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </strong>
        </p>

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Amount</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" min="0.01" max={remaining} placeholder="0.00" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note (optional)</FormLabel>
              <FormControl>
                <Input type="text" placeholder="e.g. Cash payment received" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Recording…" : "Record Payment"}
        </Button>
      </form>
    </Form>
  );
}

function MemberRepaymentForm({ loanId, remaining, currencySymbol }: Omit<Props, "adminMode">) {
  const [state, formAction, pending] = useActionState(repayLoan, {});
  const form = useForm<MemberValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: { loanAmount: undefined, contributionAmount: undefined },
  });

  if (state.success) {
    return (
      <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
        Payment recorded successfully.
      </p>
    );
  }

  function onSubmit(values: MemberValues) {
    const fd = new FormData();
    fd.set("loanId", loanId);
    if (values.loanAmount != null) fd.set("loanAmount", String(values.loanAmount));
    if (values.contributionAmount != null) fd.set("contributionAmount", String(values.contributionAmount));
    startTransition(() => formAction(fd));
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Remaining balance:{" "}
          <strong className="text-zinc-700 dark:text-zinc-300">
            {currencySymbol}{remaining.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </strong>
        </p>

        <FormField
          control={form.control}
          name="loanAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Loan Repayment</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" min="0" max={remaining} placeholder="0.00" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormDescription>Amount to apply toward this loan</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contributionAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monthly Contribution (optional)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormDescription>
                Contribution will be recorded as verified immediately
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Recording…" : "Record Payment"}
        </Button>
      </form>
    </Form>
  );
}

export function RepaymentForm({ loanId, remaining, currencySymbol, adminMode }: Props) {
  if (adminMode) {
    return <AdminRepaymentForm loanId={loanId} remaining={remaining} currencySymbol={currencySymbol} />;
  }
  return <MemberRepaymentForm loanId={loanId} remaining={remaining} currencySymbol={currencySymbol} />;
}
