"use client";

import { useActionState, useState, startTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v3";
import { respondAsGuarantor, type LoanActionState } from "@/app/actions/loans";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

const schema = z.object({
  rejectionReason: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function GuarantorResponseForm({ loanId }: { loanId: string }) {
  const [state, action, pending] = useActionState<LoanActionState, FormData>(
    respondAsGuarantor,
    {}
  );
  const [choice, setChoice] = useState<"ACCEPTED" | "REJECTED" | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { rejectionReason: "" },
  });

  if (state.success) {
    return (
      <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
        Response submitted successfully.
      </p>
    );
  }

  function onSubmit(values: FormValues) {
    const fd = new FormData();
    fd.set("loanId", loanId);
    fd.set("response", choice ?? "");
    if (values.rejectionReason) fd.set("rejectionReason", values.rejectionReason);
    startTransition(() => action(fd));
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        {choice === "REJECTED" && (
          <FormField
            control={form.control}
            name="rejectionReason"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="Reason for rejecting (required)"
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
            type={choice === "ACCEPTED" ? "submit" : "button"}
            size="sm"
            variant={choice === "ACCEPTED" ? "default" : "outline"}
            onClick={() => setChoice("ACCEPTED")}
            disabled={pending}
          >
            {pending && choice === "ACCEPTED" ? "Submitting…" : "Accept"}
          </Button>
          <Button
            type={choice === "REJECTED" ? "submit" : "button"}
            size="sm"
            variant={choice === "REJECTED" ? "destructive" : "outline"}
            onClick={() => choice !== "REJECTED" && setChoice("REJECTED")}
            disabled={pending}
          >
            {pending && choice === "REJECTED" ? "Submitting…" : "Decline"}
          </Button>
          {choice !== null && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setChoice(null)}
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
