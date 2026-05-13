"use client";

import { useActionState, startTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v3";
import { updateLoanSettings } from "@/app/actions/settings";
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

const schema = z.object({
  loanInterestRate: z.coerce
    .number()
    .min(0, "Must be at least 0")
    .max(100, "Must be at most 100"),
  loanRepaymentMonths: z.coerce
    .number()
    .int()
    .min(1, "Must be at least 1")
    .max(60, "Must be at most 60"),
  defaultGracePeriodDays: z.coerce.number().int().min(0, "Must be 0 or more"),
  currency: z.string().min(1, "Currency code is required"),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  cooperativeId: string;
  interestRate: number;
  repaymentMonths: number;
  gracePeriodDays: number;
  currency: string;
};

export function LoanSettingsForm({
  cooperativeId,
  interestRate,
  repaymentMonths,
  gracePeriodDays,
  currency,
}: Props) {
  const [state, formAction, pending] = useActionState(updateLoanSettings, {});
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      loanInterestRate: interestRate,
      loanRepaymentMonths: repaymentMonths,
      defaultGracePeriodDays: gracePeriodDays,
      currency,
    },
  });

  function onSubmit(values: FormValues) {
    const fd = new FormData();
    fd.set("cooperativeId", cooperativeId);
    fd.set("loanInterestRate", String(values.loanInterestRate));
    fd.set("loanRepaymentMonths", String(values.loanRepaymentMonths));
    fd.set("defaultGracePeriodDays", String(values.defaultGracePeriodDays));
    fd.set("currency", values.currency);
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
        {state.success && (
          <Alert>
            <AlertDescription>Loan settings updated.</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="loanInterestRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Interest Rate (%)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" max="100" {...field} />
                </FormControl>
                <FormDescription>Simple interest applied at approval</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="loanRepaymentMonths"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Repayment Period (months)</FormLabel>
                <FormControl>
                  <Input type="number" min="1" max="60" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="defaultGracePeriodDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Grace Period (days)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" {...field} />
                </FormControl>
                <FormDescription>
                  Days past due before a loan is flagged as defaulted
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency Code</FormLabel>
                <FormControl>
                  <Input type="text" maxLength={10} placeholder="NGN" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save Loan Settings"}
        </Button>
      </form>
    </Form>
  );
}
