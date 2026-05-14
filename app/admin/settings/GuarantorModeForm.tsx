"use client";

import { useActionState, startTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v3";
import {
  updateGuarantorCoverageMode,
  type SettingsActionState,
} from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

const schema = z.object({
  guarantorCoverageMode: z.enum(["OFF", "COMBINED", "INDIVIDUAL"]),
});

type FormValues = z.infer<typeof schema>;

const MODE_OPTIONS = [
  { value: "OFF" as const, label: "OFF", description: "No coverage check" },
  {
    value: "COMBINED" as const,
    label: "COMBINED",
    description: "Combined contributions must cover loan",
  },
  {
    value: "INDIVIDUAL" as const,
    label: "INDIVIDUAL",
    description: "Each guarantor must individually cover loan",
  },
];

export function GuarantorModeForm({
  cooperativeId,
  currentMode,
}: {
  cooperativeId: string;
  currentMode: string;
}) {
  const [state, action, pending] = useActionState<SettingsActionState, FormData>(
    updateGuarantorCoverageMode,
    {}
  );
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      guarantorCoverageMode: (currentMode as FormValues["guarantorCoverageMode"]) ?? "OFF",
    },
  });

  function onSubmit(values: FormValues) {
    const fd = new FormData();
    fd.set("cooperativeId", cooperativeId);
    fd.set("guarantorCoverageMode", values.guarantorCoverageMode);
    startTransition(() => action(fd));
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 mt-2">
        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        {state.success && (
          <Alert>
            <AlertDescription>Coverage mode updated.</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="guarantorCoverageMode"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="space-y-2">
                  {MODE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-start gap-3 p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <input
                        type="radio"
                        value={opt.value}
                        checked={field.value === opt.value}
                        onChange={() => field.onChange(opt.value)}
                        className="my-auto accent-primary"
                      />
                      <span>
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {opt.label}
                        </span>
                        <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                          {opt.description}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" size="sm" disabled={pending || !form.formState.isDirty}>
          {pending ? "Saving…" : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
}
