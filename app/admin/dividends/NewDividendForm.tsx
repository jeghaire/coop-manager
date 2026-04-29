"use client";

import { useActionState, useState } from "react";
import { createDividendPayout, type DividendActionState } from "@/app/actions/dividends";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [period, setPeriod] = useState("Q1");
  const [totalProfit, setTotalProfit] = useState("");
  const [adminPct, setAdminPct] = useState("10");
  const [reservePct, setReservePct] = useState("20");

  const profit = parseFloat(totalProfit) || 0;
  const admin = profit * (parseFloat(adminPct) / 100 || 0);
  const reserve = profit * (parseFloat(reservePct) / 100 || 0);
  const pool = Math.max(0, profit - admin - reserve);

  if (state.success && open) setOpen(false);

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
            <button
              onClick={() => setOpen(false)}
              className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              Cancel
            </button>
          </div>

          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <form action={action} className="space-y-4">
            <input type="hidden" name="cooperativeId" value={cooperativeId} />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="period">Period</Label>
                <input type="hidden" name="period" value={period} />
                <Select value={period} onValueChange={(v) => setPeriod(v ?? "Q1")}>
                  <SelectTrigger id="period">
                    <SelectValue>{period}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Q1">Q1 (Jan–Mar)</SelectItem>
                    <SelectItem value="Q2">Q2 (Apr–Jun)</SelectItem>
                    <SelectItem value="Q3">Q3 (Jul–Sep)</SelectItem>
                    <SelectItem value="Q4">Q4 (Oct–Dec)</SelectItem>
                    <SelectItem value="ANNUAL">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  name="year"
                  type="number"
                  defaultValue={new Date().getFullYear()}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="totalProfit">Total Profit ({currencySymbol})</Label>
              <Input
                id="totalProfit"
                name="totalProfit"
                type="number"
                min="1"
                step="any"
                value={totalProfit}
                onChange={(e) => setTotalProfit(e.target.value)}
                placeholder="e.g. 500000"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="adminCostsPct">Admin Costs %</Label>
                <Input
                  id="adminCostsPct"
                  name="adminCostsPct"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={adminPct}
                  onChange={(e) => setAdminPct(e.target.value)}
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {currencySymbol}{admin.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="loanLossReservePct">Loan Loss Reserve %</Label>
                <Input
                  id="loanLossReservePct"
                  name="loanLossReservePct"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={reservePct}
                  onChange={(e) => setReservePct(e.target.value)}
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {currencySymbol}{reserve.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg p-4 space-y-2 text-sm">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Distribution Preview</p>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Total profit</span>
                <span>{currencySymbol}{profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between text-zinc-500 dark:text-zinc-500">
                <span>Admin costs ({adminPct}%)</span>
                <span>−{currencySymbol}{admin.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between text-zinc-500 dark:text-zinc-500">
                <span>Reserve ({reservePct}%)</span>
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
        </div>
      )}
    </div>
  );
}
