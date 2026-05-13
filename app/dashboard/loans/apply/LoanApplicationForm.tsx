"use client";

import { useActionState, useEffect, startTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v3";
import { applyForLoan, type LoanActionState } from "@/app/actions/loans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
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
  amount: z.coerce.number().min(1000, "Minimum amount is 1,000"),
  purpose: z.string().optional(),
  guarantor1Id: z.string().min(1, "Please select a first guarantor"),
  guarantor2Id: z.string().min(1, "Please select a second guarantor"),
});

type FormValues = z.infer<typeof schema>;
type Member = { id: string; name: string };

export function LoanApplicationForm({
  members,
  borrowingCapacity,
  guarantorCoverageMode,
  currencySymbol,
  defaultValues,
  onSuccess,
}: {
  members: Member[];
  borrowingCapacity: number;
  guarantorCoverageMode: string;
  currencySymbol: string;
  defaultValues?: { amount: string; guarantor1Id: string; guarantor2Id: string };
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<LoanActionState, FormData>(
    applyForLoan,
    {}
  );
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: defaultValues?.amount ? Number(defaultValues.amount) : undefined,
      purpose: "",
      guarantor1Id: defaultValues?.guarantor1Id ?? "",
      guarantor2Id: defaultValues?.guarantor2Id ?? "",
    },
  });

  useEffect(() => {
    if (state.success) {
      onSuccess?.();
      router.push("/dashboard/loans");
    }
  }, [state.success, router, onSuccess]);

  const guarantor1Id = form.watch("guarantor1Id");
  const guarantor2Id = form.watch("guarantor2Id");
  const availableFor1 = members.filter((m) => m.id !== guarantor2Id);
  const availableFor2 = members.filter((m) => m.id !== guarantor1Id);

  const coverageLabel =
    guarantorCoverageMode === "COMBINED"
      ? "Guarantors' combined contributions must cover the loan amount."
      : guarantorCoverageMode === "INDIVIDUAL"
      ? "Each guarantor must individually have contributions ≥ loan amount."
      : "No guarantor coverage check required.";

  function onSubmit(values: FormValues) {
    const fd = new FormData();
    fd.set("amount", String(values.amount));
    if (values.purpose) fd.set("purpose", values.purpose);
    fd.set("guarantor1Id", values.guarantor1Id);
    fd.set("guarantor2Id", values.guarantor2Id);
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

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount ({currencySymbol})</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1000"
                  max={borrowingCapacity}
                  step="500"
                  placeholder="e.g. 50000"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>
                Maximum: {currencySymbol}{borrowingCapacity.toLocaleString()}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="purpose"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Purpose (optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="What is this loan for?" rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="guarantor1Id"
          render={({ field }) => {
            const selectedGuarantor = availableFor1.find((m) => m.id === field.value);

            return (
              <FormItem>
                <FormLabel>First Guarantor</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a verified member…">
                        {selectedGuarantor ? selectedGuarantor.name : "Select a verified member…"}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableFor1.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
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
          name="guarantor2Id"
          render={({ field }) => {
            const selectedGuarantor = availableFor2.find((m) => m.id === field.value);

            return (
              <FormItem>
                <FormLabel>Second Guarantor</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a verified member…">
                        {selectedGuarantor ? selectedGuarantor.name : "Select a verified member…"}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableFor2.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>{coverageLabel}</FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Submitting…" : "Submit Application"}
        </Button>
      </form>
    </Form>
  );
}
