"use client";

import { useActionState } from "react";
import { updateNotificationSettings, type UserActionState } from "@/app/actions/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          Preferences saved.
        </p>
      )}

      <form action={action} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="phoneNumber">Phone Number (for SMS)</Label>
          <Input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            defaultValue={phoneNumber ?? ""}
            placeholder="+234 800 000 0000"
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Include country code. Leave blank to disable SMS.
          </p>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="emailNotifications"
              defaultChecked={emailNotifications}
              className="w-4 h-4 rounded accent-emerald-600"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              Email notifications (loan updates, contribution verified, dividends)
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="smsNotifications"
              defaultChecked={smsNotifications}
              className="w-4 h-4 rounded accent-emerald-600"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              SMS notifications (requires phone number above)
            </span>
          </label>
        </div>

        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save Preferences"}
        </Button>
      </form>
    </div>
  );
}
