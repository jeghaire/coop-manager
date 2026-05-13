"use client";

import { useActionState, useState, startTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v3";
import { reviewLoan, type LoanActionState } from "@/app/actions/loans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  reason: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function LoanReviewForm({ loanId }: { loanId: string }) {
  const [state, action, pending] = useActionState<LoanActionState, FormData>(
    reviewLoan,
    {}
  );
  const [decision, setDecision] = useState<"APPROVED" | "REJECTED" | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { reason: "" },
  });

  if (state.success) {
    return (
      <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
        Decision recorded.
      </p>
    );
  }

  function onSubmit(values: FormValues) {
    const fd = new FormData();
    fd.set("loanId", loanId);
    fd.set("decision", decision ?? "");
    if (values.reason) fd.set("reason", values.reason);
    startTransition(() => action(fd));
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-3 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800"
      >
        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        {decision === "REJECTED" && (
          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="Reason for rejection (required)"
                    rows={2}
                    className="text-sm"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex gap-2">
          <Button
            type={decision === "APPROVED" ? "submit" : "button"}
            size="sm"
            variant={decision === "APPROVED" ? "default" : "outline"}
            onClick={() => setDecision("APPROVED")}
            disabled={pending}
          >
            {pending && decision === "APPROVED" ? "Saving…" : "Approve"}
          </Button>
          <Button
            type={decision === "REJECTED" ? "submit" : "button"}
            size="sm"
            variant={decision === "REJECTED" ? "destructive" : "outline"}
            onClick={() => decision !== "REJECTED" && setDecision("REJECTED")}
            disabled={pending}
          >
            {pending && decision === "REJECTED" ? "Saving…" : "Reject"}
          </Button>
          {decision !== null && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setDecision(null)}
              disabled={pending}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
