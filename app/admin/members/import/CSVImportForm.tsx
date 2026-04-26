"use client";

import { useActionState, useState } from "react";
import { importMembers, type AdminActionState } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";

export function CSVImportForm() {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(
    importMembers,
    {}
  );
  const [mode, setMode] = useState<"file" | "paste">("paste");

  if (state.success && state.importResults) {
    const { created, skipped } = state.importResults;
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription className="text-emerald-700 dark:text-emerald-400">
            Import complete: {created} member{created !== 1 ? "s" : ""} created.
            {skipped.length > 0 && ` ${skipped.length} skipped.`}
          </AlertDescription>
        </Alert>

        {skipped.length > 0 && (
          <div className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
              Skipped rows
            </p>
            <ul className="space-y-1">
              {skipped.map((s, i) => (
                <li key={i} className="text-xs text-zinc-600 dark:text-zinc-400">
                  • {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
        >
          Import more
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Mode toggle */}
      <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setMode("paste")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            mode === "paste"
              ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          Paste CSV
        </button>
        <button
          type="button"
          onClick={() => setMode("file")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            mode === "file"
              ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          Upload File
        </button>
      </div>

      {mode === "paste" ? (
        <div className="space-y-1.5">
          <Label htmlFor="csvText">CSV Content</Label>
          <Textarea
            id="csvText"
            name="csvText"
            rows={8}
            placeholder={`name,email,monthly_amount\nChioma Obi,chioma@example.com,10000\nEmeka Nwosu,emeka@example.com,15000`}
            className="font-mono text-sm"
          />
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor="csvFile">CSV File</Label>
          <input
            id="csvFile"
            name="csvFile"
            type="file"
            accept=".csv,text/csv"
            className="block w-full text-sm text-zinc-600 dark:text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-zinc-100 file:text-zinc-700 dark:file:bg-zinc-800 dark:file:text-zinc-300 hover:file:bg-zinc-200 dark:hover:file:bg-zinc-700 transition-colors cursor-pointer"
          />
        </div>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Importing…" : "Import Members"}
      </Button>
    </form>
  );
}
