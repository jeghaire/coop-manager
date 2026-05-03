"use client";

import { useActionState, useState } from "react";
import {
  createAnnouncement,
  type AnnouncementActionState,
} from "@/app/actions/announcements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function NewAnnouncementForm({ cooperativeId }: { cooperativeId: string }) {
  const [state, action, pending] = useActionState<AnnouncementActionState, FormData>(
    createAnnouncement,
    {}
  );
  const [type, setType] = useState("GENERAL");
  const [recipientType, setRecipientType] = useState("ALL");
  const [isPinned, setIsPinned] = useState(true);
  const [allowRsvp, setAllowRsvp] = useState(false);

  if (state.success) {
    return (
      <Alert>
        <AlertDescription className="text-emerald-700 dark:text-emerald-400">
          Announcement created and notifications sent.
        </AlertDescription>
      </Alert>
    );
  }

  const isAgm = type === "AGM";

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="cooperativeId" value={cooperativeId} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="recipientType" value={recipientType} />
      <input type="hidden" name="isPinned" value={String(isPinned)} />
      <input type="hidden" name="allowRsvp" value={String(isAgm && allowRsvp)} />

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" placeholder="Announcement title" required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="type-select">Type</Label>
        <Select value={type} onValueChange={(v) => { if (v) { setType(v); if (v !== "AGM") setAllowRsvp(false); } }}>
          <SelectTrigger id="type-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GENERAL">General</SelectItem>
            <SelectItem value="AGM">AGM</SelectItem>
            <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
            <SelectItem value="RULE_CHANGE">Rule Change</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          name="message"
          rows={6}
          placeholder="Write your announcement here…"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="recipient-select">Recipients</Label>
        <Select value={recipientType} onValueChange={(v) => { if (v) setRecipientType(v); }}>
          <SelectTrigger id="recipient-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Members</SelectItem>
            <SelectItem value="MEMBERS_ONLY">Members Only</SelectItem>
            <SelectItem value="ADMINS_ONLY">Admins Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isAgm && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="agmDate">AGM Date &amp; Time</Label>
            <Input
              id="agmDate"
              name="agmDate"
              type="datetime-local"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="agmLocation">AGM Location</Label>
            <Input
              id="agmLocation"
              name="agmLocation"
              placeholder="e.g. Community Hall, Lagos"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={allowRsvp}
              onChange={(e) => setAllowRsvp(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              Allow members to RSVP
            </span>
          </label>
        </>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="expiresAt">Expires At (optional)</Label>
        <Input
          id="expiresAt"
          name="expiresAt"
          type="datetime-local"
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Leave blank to keep active indefinitely.
        </p>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isPinned}
          onChange={(e) => setIsPinned(e.target.checked)}
          className="rounded"
        />
        <span className="text-sm text-zinc-700 dark:text-zinc-300">
          Pin to dashboard banner
        </span>
      </label>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating…" : "Create & Send"}
      </Button>
    </form>
  );
}
