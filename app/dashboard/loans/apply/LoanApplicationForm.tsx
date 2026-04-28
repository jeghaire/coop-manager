"use client";

import { useActionState, useState } from "react";
import { applyForLoan, type LoanActionState } from "@/app/actions/loans";
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
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type Member = { id: string; name: string };

export function LoanApplicationForm({
  members,
  borrowingCapacity,
  guarantorCoverageMode,
  defaultValues,
}: {
  members: Member[];
  borrowingCapacity: number;
  guarantorCoverageMode: string;
  defaultValues?: { amount: string; guarantor1Id: string; guarantor2Id: string };
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<LoanActionState, FormData>(
    applyForLoan,
    {}
  );
  const [guarantor1Id, setGuarantor1Id] = useState(defaultValues?.guarantor1Id ?? "");
  const [guarantor2Id, setGuarantor2Id] = useState(defaultValues?.guarantor2Id ?? "");

  useEffect(() => {
    if (state.success) {
      router.push("/dashboard/loans");
    }
  }, [state.success, router]);

  const availableFor1 = members.filter((m) => m.id !== guarantor2Id);
  const availableFor2 = members.filter((m) => m.id !== guarantor1Id);

  const coverageLabel =
    guarantorCoverageMode === "COMBINED"
      ? "Guarantors' combined contributions must cover the loan amount."
      : guarantorCoverageMode === "INDIVIDUAL"
      ? "Each guarantor must individually have contributions ≥ loan amount."
      : "No guarantor coverage check required.";

  return (
    <form action={action} className="space-y-5">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="amount">Amount (₦)</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          min="1000"
          max={borrowingCapacity}
          step="500"
          placeholder="e.g. 50000"
          defaultValue={defaultValues?.amount}
          required
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Maximum: ₦{borrowingCapacity.toLocaleString()}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="purpose">Purpose (optional)</Label>
        <Textarea
          id="purpose"
          name="purpose"
          placeholder="What is this loan for?"
          rows={2}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="guarantor1">First Guarantor</Label>
        <input type="hidden" name="guarantor1Id" value={guarantor1Id} />
        <Select value={guarantor1Id} onValueChange={(v) => setGuarantor1Id(v ?? "")}>
          <SelectTrigger id="guarantor1">
            <SelectValue>
              {guarantor1Id
                ? (members.find((m) => m.id === guarantor1Id)?.name ?? "Select a verified member")
                : "Select a verified member"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {availableFor1.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="guarantor2">Second Guarantor</Label>
        <input type="hidden" name="guarantor2Id" value={guarantor2Id} />
        <Select value={guarantor2Id} onValueChange={(v) => setGuarantor2Id(v ?? "")}>
          <SelectTrigger id="guarantor2">
            <SelectValue>
              {guarantor2Id
                ? (members.find((m) => m.id === guarantor2Id)?.name ?? "Select a verified member")
                : "Select a verified member"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {availableFor2.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{coverageLabel}</p>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={pending || !guarantor1Id || !guarantor2Id}
      >
        {pending ? "Submitting…" : "Submit Application"}
      </Button>
    </form>
  );
}
