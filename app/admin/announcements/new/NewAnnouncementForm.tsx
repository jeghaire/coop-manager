"use client";

import { useActionState, startTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v3";
import {
  createAnnouncement,
  type AnnouncementActionState,
} from "@/app/actions/announcements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
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
  title: z.string().min(1, "Title is required"),
  type: z.enum(["GENERAL", "AGM", "MAINTENANCE", "RULE_CHANGE"]),
  message: z.string().min(1, "Message is required"),
  recipientType: z.enum(["ALL", "MEMBERS_ONLY", "ADMINS_ONLY"]),
  isPinned: z.boolean(),
  allowRsvp: z.boolean(),
  agmDate: z.string().optional(),
  agmLocation: z.string().optional(),
  expiresAt: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const TYPE_LABELS: Record<string, string> = {
  GENERAL: "General",
  AGM: "AGM",
  MAINTENANCE: "Maintenance",
  RULE_CHANGE: "Rule Change",
};

const RECIPIENT_LABELS: Record<string, string> = {
  ALL: "All Members",
  MEMBERS_ONLY: "Members Only",
  ADMINS_ONLY: "Admins Only",
};

export function NewAnnouncementForm({ cooperativeId }: { cooperativeId: string }) {
  const [state, action, pending] = useActionState<AnnouncementActionState, FormData>(
    createAnnouncement,
    {}
  );
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      type: "GENERAL",
      message: "",
      recipientType: "ALL",
      isPinned: true,
      allowRsvp: false,
      agmDate: "",
      agmLocation: "",
      expiresAt: "",
    },
  });

  const type = form.watch("type");
  const isAgm = type === "AGM";

  function onSubmit(values: FormValues) {
    const fd = new FormData();
    fd.set("cooperativeId", cooperativeId);
    fd.set("title", values.title);
    fd.set("type", values.type);
    fd.set("message", values.message);
    fd.set("recipientType", values.recipientType);
    fd.set("isPinned", String(values.isPinned));
    fd.set("allowRsvp", String(isAgm && values.allowRsvp));
    if (values.agmDate) fd.set("agmDate", values.agmDate);
    if (values.agmLocation) fd.set("agmLocation", values.agmLocation);
    if (values.expiresAt) fd.set("expiresAt", values.expiresAt);
    startTransition(() => action(fd));
  }

  if (state.success) {
    return (
      <Alert>
        <AlertDescription className="text-emerald-700 dark:text-emerald-400">
          Announcement created and notifications sent.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Announcement title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => {
            const selectedType = TYPE_LABELS[field.value] ?? field.value;

            return (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v);
                    if (v !== "AGM") form.setValue("allowRsvp", false);
                  }}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a type…">
                        {selectedType}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="GENERAL">General</SelectItem>
                    <SelectItem value="AGM">AGM</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    <SelectItem value="RULE_CHANGE">Rule Change</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea rows={6} placeholder="Write your announcement here…" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="recipientType"
          render={({ field }) => {
            const selectedRecipient = RECIPIENT_LABELS[field.value] ?? field.value;

            return (
              <FormItem>
                <FormLabel>Recipients</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select recipients…">
                        {selectedRecipient}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ALL">All Members</SelectItem>
                    <SelectItem value="MEMBERS_ONLY">Members Only</SelectItem>
                    <SelectItem value="ADMINS_ONLY">Admins Only</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        {isAgm && (
          <>
            <FormField
              control={form.control}
              name="agmDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AGM Date &amp; Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="agmLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AGM Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Community Hall, Lagos" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allowRsvp"
              render={({ field }) => (
                <FormItem>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      Allow members to RSVP
                    </span>
                  </label>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <FormField
          control={form.control}
          name="expiresAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expires At (optional)</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormDescription>Leave blank to keep active indefinitely.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isPinned"
          render={({ field }) => (
            <FormItem>
              <label className="flex items-center gap-2 cursor-pointer">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  Pin to dashboard banner
                </span>
              </label>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creating…" : "Create & Send"}
        </Button>
      </form>
    </Form>
  );
}
