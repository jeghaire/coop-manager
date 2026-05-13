"use client";

import { useActionState, useState, startTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v3";
import { createDividendPayout, type DividendActionState } from "@/app/actions/dividends";
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
  period: z.enum(["Q1", "Q2", "Q3", "Q4", "ANNUAL"]),
  year: z.coerce.number().int().min(2000).max(2100),
  totalProfit: z.coerce.number().min(1, "Total profit must be greater than 0"),
  adminCostsPct: z.coerce.number().min(0).max(100),
  loanLossReservePct: z.coerce.number().min(0).max(100),
});

type FormValues = z.infer<typeof schema>;

const PERIOD_LABELS: Record<string, string> = {
  Q1: "Q1 (Jan–Mar)",
  Q2: "Q2 (Apr–Jun)",
  Q3: "Q3 (Jul–Sep)",
  Q4: "Q4 (Oct–Dec)",
  ANNUAL: "Annual",
};

export function NewDividendForm({
  cooperativeId,
  currencySymbol,
}: {
  cooperativeId: string;
  currencySymbol: string;
}) {
  const [state, action, pending] = useActionState<DividendActionState, FormData>(
    createDividendPayout,
    {}
  );
  const [open, setOpen] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      period: "Q1",
      year: new Date().getFullYear(),
      totalProfit: 0,
      adminCostsPct: 10,
      loanLossReservePct: 20,
    },
  });

  const totalProfit = form.watch("totalProfit") || 0;
  const adminCostsPct = form.watch("adminCostsPct") || 0;
  const loanLossReservePct = form.watch("loanLossReservePct") || 0;

  const profit = Number(totalProfit) || 0;
  const admin = profit * (Number(adminCostsPct) / 100);
  const reserve = profit * (Number(loanLossReservePct) / 100);
  const pool = Math.max(0, profit - admin - reserve);

  if (state.success && open) setOpen(false);

  function onSubmit(values: FormValues) {
    const fd = new FormData();
    fd.set("cooperativeId", cooperativeId);
    fd.set("period", values.period);
    fd.set("year", String(values.year));
    fd.set("totalProfit", String(values.totalProfit));
    fd.set("adminCostsPct", String(values.adminCostsPct));
    fd.set("loanLossReservePct", String(values.loanLossReservePct));
    startTransition(() => action(fd));
  }

  return (
    <div>
      {!open ? (
        <Button onClick={() => setOpen(true)}>New Dividend Payout</Button>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Create Dividend Payout
            </h2>
            <Button
              type="button"
              onClick={() => setOpen(false)}
              variant="ghost"
              className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              Cancel
            </Button>
          </div>

          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="period"
                  render={({ field }) => {
                    const selectedPeriod = PERIOD_LABELS[field.value] ?? field.value;

                    return (
                      <FormItem>
                        <FormLabel>Period</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a period…">
                                {selectedPeriod}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(PERIOD_LABELS).map(([value, label]) => (
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
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="totalProfit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Profit ({currencySymbol})</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        step="any"
                        placeholder="e.g. 500000"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="adminCostsPct"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admin Costs %</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" max="100" step="0.1" {...field} />
                      </FormControl>
                      <FormDescription>
                        {currencySymbol}
                        {admin.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="loanLossReservePct"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loan Loss Reserve %</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" max="100" step="0.1" {...field} />
                      </FormControl>
                      <FormDescription>
                        {currencySymbol}
                        {reserve.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Summary */}
              <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg p-4 space-y-2 text-sm">
                <p className="font-medium text-zinc-900 dark:text-zinc-100">Distribution Preview</p>
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Total profit</span>
                  <span>{currencySymbol}{profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between text-zinc-500 dark:text-zinc-500">
                  <span>Admin costs ({adminCostsPct}%)</span>
                  <span>−{currencySymbol}{admin.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between text-zinc-500 dark:text-zinc-500">
                  <span>Reserve ({loanLossReservePct}%)</span>
                  <span>−{currencySymbol}{reserve.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between font-semibold text-emerald-700 dark:text-emerald-400 border-t border-emerald-200 dark:border-emerald-500/30 pt-2 mt-1">
                  <span>Dividend pool</span>
                  <span>{currencySymbol}{pool.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={pending || pool <= 0}>
                {pending ? "Creating…" : "Create Payout"}
              </Button>
            </form>
          </Form>
        </div>
      )}
    </div>
  );
}
