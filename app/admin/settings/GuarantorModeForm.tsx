"use client";

import { useActionState } from "react";
import { updateGuarantorCoverageMode, type SettingsActionState } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const MODE_OPTIONS = [
  { value: "OFF", label: "OFF", description: "No coverage check" },
  { value: "COMBINED", label: "COMBINED", description: "Combined contributions must cover loan" },
  { value: "INDIVIDUAL", label: "INDIVIDUAL", description: "Each guarantor must individually cover loan" },
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

  return (
    <form action={action} className="space-y-3 mt-2">
      <input type="hidden" name="cooperativeId" value={cooperativeId} />

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

      <div className="space-y-2">
        {MODE_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className="flex items-start gap-3 p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
          >
            <input
              type="radio"
              name="guarantorCoverageMode"
              value={opt.value}
              defaultChecked={currentMode === opt.value}
              className="mt-0.5"
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

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save Changes"}
      </Button>
    </form>
  );
}
