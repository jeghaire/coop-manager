"use client";

import { useActionState, startTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v3";
import { recordRepaymentForMember } from "@/app/actions/loans";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

const schema = z.object({
  loanId: z.string().min(1, "Please select a loan"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type Loan = {
  id: string;
  amountRequested: unknown;
  remaining: number;
  applicant: { name: string };
};

type Props = {
  loans: Loan[];
  currencySymbol: string;
};

export function RecordRepaymentForm({ loans, currencySymbol }: Props) {
  const [state, formAction, pending] = useActionState(recordRepaymentForMember, {});
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { loanId: "", amount: undefined, note: "" },
  });

  function onSubmit(values: FormValues) {
    const fd = new FormData();
    fd.set("loanId", values.loanId);
    fd.set("amount", String(values.amount));
    if (values.note) fd.set("note", values.note);
    startTransition(() => formAction(fd));
  }

  const selectedLoan = loans.find((l) => l.id === form.watch("loanId"));

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
            <AlertDescription>Repayment recorded successfully.</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="loanId"
          render={({ field }) => {
            const loan = loans.find((l) => l.id === field.value);
            const loanLabel = loan
              ? `${loan.applicant.name} — ${currencySymbol}${Number(loan.amountRequested).toLocaleString()} (${currencySymbol}${loan.remaining.toLocaleString(undefined, { maximumFractionDigits: 2 })} remaining)`
              : "Select a loan…";

            return (
              <FormItem>
                <FormLabel>Active Loan</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a loan…">
                        {loanLabel}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {loans.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.applicant.name} — {currencySymbol}
                        {Number(l.amountRequested).toLocaleString()} (
                        {currencySymbol}
                        {l.remaining.toLocaleString(undefined, { maximumFractionDigits: 2 })} remaining)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount ({currencySymbol})</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedLoan?.remaining}
                  placeholder="0.00"
                  {...field}
                  value={field.value ?? ""}
                />
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
                <Input type="text" placeholder="e.g. Bank transfer ref #12345" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Recording…" : "Record Repayment"}
        </Button>
      </form>
    </Form>
  );
}
