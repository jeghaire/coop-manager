"use client";

import { useActionState, useState, startTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v3";
import {
  verifyContribution,
  type ContributionActionState,
} from "@/app/actions/contributions";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
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

export function ContributionReviewForm({
  contributionId,
}: {
  contributionId: string;
}) {
  const [state, action, pending] = useActionState<ContributionActionState, FormData>(
    verifyContribution,
    {}
  );
  const [decision, setDecision] = useState<"VERIFIED" | "REJECTED" | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { rejectionReason: "" },
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
    fd.set("contributionId", contributionId);
    fd.set("decision", decision ?? "");
    if (values.rejectionReason) fd.set("rejectionReason", values.rejectionReason);
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
            name="rejectionReason"
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
            type={decision === "VERIFIED" ? "submit" : "button"}
            size="sm"
            variant={decision === "VERIFIED" ? "default" : "outline"}
            onClick={() => setDecision("VERIFIED")}
            disabled={pending}
          >
            {pending && decision === "VERIFIED" ? "Saving…" : "Verify"}
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
