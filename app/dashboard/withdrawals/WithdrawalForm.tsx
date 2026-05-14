"use client";

import { useActionState, useEffect, startTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v3";
import {
  requestWithdrawal,
  type WithdrawalActionState,
} from "@/app/actions/withdrawals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
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
  FormDescription,
  FormMessage,
} from "@/components/ui/form";

const REASONS = [
  { value: "PERSONAL", label: "Personal Use" },
  { value: "EMERGENCY", label: "Emergency" },
  { value: "LEAVING", label: "Leaving Cooperative" },
  { value: "OTHER", label: "Other" },
] as const;

const schema = z.object({
  amount: z.coerce.number().min(1, "Amount must be at least 1"),
  reason: z.string().min(1, "Please select a reason"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function WithdrawalForm({
  maxAmount,
  currencySymbol,
}: {
  maxAmount: number;
  currencySymbol: string;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<
    WithdrawalActionState,
    FormData
  >(requestWithdrawal, {});
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: undefined, reason: "", notes: "" },
  });

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  function onSubmit(values: FormValues) {
    const fd = new FormData();
    fd.set("amount", String(values.amount));
    fd.set("reason", values.reason);
    if (values.notes) fd.set("notes", values.notes);
    startTransition(() => action(fd));
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        {state.success && (
          <Alert>
            <AlertDescription>
              Withdrawal request submitted. You will be notified when it&apos;s
              reviewed.
            </AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount ({currencySymbol})</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  max={maxAmount}
                  placeholder="0.00"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>
                Maximum: {currencySymbol}
                {maxAmount.toLocaleString()}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => {
            const selectedReason = REASONS.find((r) => r.value === field.value);

            return (
              <FormItem>
                <FormLabel>Reason</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a reason…">
                        {selectedReason
                          ? selectedReason.label
                          : "Select a reason…"}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {REASONS.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
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
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Notes{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any additional context…"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Submitting…" : "Request Withdrawal"}
        </Button>
      </form>
    </Form>
  );
}
