"use client";

import { useActionState, useState } from "react";
import {
  deactivateAnnouncement,
  type AnnouncementActionState,
} from "@/app/actions/announcements";
import { Button } from "@/components/ui/button";

export function DeactivateButton({
  announcementId,
  cooperativeId,
}: {
  announcementId: string;
  cooperativeId: string;
}) {
  const [confirm, setConfirm] = useState(false);
  const [state, action, pending] = useActionState<AnnouncementActionState, FormData>(
    deactivateAnnouncement,
    {}
  );

  if (state.success) {
    return (
      <span className="text-xs text-zinc-400 dark:text-zinc-600">Deactivated</span>
    );
  }

  if (!confirm) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900 dark:hover:bg-red-950"
        onClick={() => setConfirm(true)}
      >
        Deactivate
      </Button>
    );
  }

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="announcementId" value={announcementId} />
      <input type="hidden" name="cooperativeId" value={cooperativeId} />
      {state.error && (
        <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>
      )}
      <Button type="submit" size="sm" variant="destructive" disabled={pending}>
        {pending ? "Deactivating…" : "Confirm"}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => setConfirm(false)}
      >
        Cancel
      </Button>
    </form>
  );
}
