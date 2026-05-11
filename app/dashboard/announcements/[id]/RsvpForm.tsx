"use client";

import { useActionState } from "react";
import {
  rsvpAnnouncement,
  type AnnouncementActionState,
} from "@/app/actions/announcements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form } from "@/components/ui/form";

const OPTIONS = [
  { value: "ATTENDING", label: "Attending" },
  { value: "MAYBE", label: "Maybe" },
  { value: "NOT_ATTENDING", label: "Not Attending" },
] as const;

export function RsvpForm({
  announcementId,
  currentStatus,
}: {
  announcementId: string;
  currentStatus: string | null;
}) {
  const [state, action, pending] = useActionState<AnnouncementActionState, FormData>(
    rsvpAnnouncement,
    {}
  );

  return (
    <div className="space-y-3">
      {state.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map(({ value, label }) => {
          const isSelected = currentStatus === value;
          return (
            <Form key={value} action={action}>
              <Input type="hidden" name="announcementId" value={announcementId} />
              <Input type="hidden" name="rsvpStatus" value={value} />
              <Button
                type="submit"
                size="sm"
                variant={isSelected ? "default" : "outline"}
                disabled={pending}
                className={
                  isSelected
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                    : ""
                }
              >
                {label}
              </Button>
            </Form>
          );
        })}
      </div>
      {state.success && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400">
          RSVP updated.
        </p>
      )}
    </div>
  );
}
