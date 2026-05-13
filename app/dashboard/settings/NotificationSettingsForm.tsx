"use client";

import { useActionState, startTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v3";
import { updateNotificationSettings, type UserActionState } from "@/app/actions/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
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
  phoneNumber: z.string().optional(),
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function NotificationSettingsForm({
  phoneNumber,
  emailNotifications,
  smsNotifications,
}: {
  phoneNumber: string | null;
  emailNotifications: boolean;
  smsNotifications: boolean;
}) {
  const [state, action, pending] = useActionState<UserActionState, FormData>(
    updateNotificationSettings,
    {}
  );
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      phoneNumber: phoneNumber ?? "",
      emailNotifications,
      smsNotifications,
    },
  });

  function onSubmit(values: FormValues) {
    const fd = new FormData();
    if (values.phoneNumber) fd.set("phoneNumber", values.phoneNumber);
    if (values.emailNotifications) fd.set("emailNotifications", "on");
    if (values.smsNotifications) fd.set("smsNotifications", "on");
    startTransition(() => action(fd));
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-6 space-y-5">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Notification Preferences
      </h2>

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.success && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">Preferences saved.</p>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number (for SMS)</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="+234 800 000 0000" {...field} />
                </FormControl>
                <FormDescription>
                  Include country code. Leave blank to disable SMS.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-3">
            <FormField
              control={form.control}
              name="emailNotifications"
              render={({ field }) => (
                <FormItem>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      Email notifications (loan updates, contribution verified, dividends)
                    </span>
                  </label>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="smsNotifications"
              render={({ field }) => (
                <FormItem>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      SMS notifications (requires phone number above)
                    </span>
                  </label>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Saving…" : "Save Preferences"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
