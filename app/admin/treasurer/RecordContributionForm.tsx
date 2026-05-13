"use client";

import { useActionState, startTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v3";
import { recordContributionForMember } from "@/app/actions/contributions";
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
  FormDescription,
  FormMessage,
} from "@/components/ui/form";

const schema = z.object({
  memberId: z.string().min(1, "Please select a member"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;
type Member = { id: string; name: string; email: string };

type Props = {
  members: Member[];
  currencySymbol: string;
};

export function RecordContributionForm({ members, currencySymbol }: Props) {
  const [state, formAction, pending] = useActionState(
    recordContributionForMember,
    {},
  );
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { memberId: "", amount: undefined, note: "" },
  });

  function onSubmit(values: FormValues) {
    const fd = new FormData();
    fd.set("memberId", values.memberId);
    fd.set("amount", String(values.amount));
    if (values.note) fd.set("note", values.note);
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
            <AlertDescription>
              Contribution recorded and verified.
            </AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="memberId"
          render={({ field }) => {
            const selectedMember = members.find((m) => m.id === field.value);

            return (
              <FormItem>
                <FormLabel>Member</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a member…">
                        {selectedMember
                          ? `${selectedMember.name} (${selectedMember.email})`
                          : "Select a member…"}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} ({m.email})
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
                  placeholder="0.00"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>
                Recorded as verified — no approval needed
              </FormDescription>
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
                <Input
                  type="text"
                  placeholder="e.g. January 2026 contribution"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Recording…" : "Record Contribution"}
        </Button>
      </form>
    </Form>
  );
}
