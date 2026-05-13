"use client";

import { useActionState, startTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v3";
import { inviteMember, type AdminActionState } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  monthlyAmount: z.coerce.number().min(0, "Must be 0 or more"),
  role: z.enum(["MEMBER", "TREASURER", "ADMIN"]),
});

type FormValues = z.infer<typeof schema>;

const ROLES = [
  { value: "MEMBER" as const, label: "Member" },
  { value: "TREASURER" as const, label: "Treasurer" },
  { value: "ADMIN" as const, label: "Admin" },
];

export function InviteMemberForm({
  isOwner,
  currencySymbol = "₦",
}: {
  isOwner: boolean;
  currencySymbol?: string;
}) {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(
    inviteMember,
    {}
  );
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", monthlyAmount: 0, role: "MEMBER" },
  });

  function onSubmit(values: FormValues) {
    const fd = new FormData();
    fd.set("name", values.name);
    fd.set("email", values.email);
    fd.set("monthlyAmount", String(values.monthlyAmount));
    fd.set("role", values.role);
    startTransition(() => action(fd));
  }

  if (state.success) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription className="text-emerald-700 dark:text-emerald-400">
            {state.message}
          </AlertDescription>
        </Alert>
        {state.tempPassword && (
          <div className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wide font-semibold">
              Temporary Password
            </p>
            <p className="font-mono text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-wider">
              {state.tempPassword}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
              Share this with the member. They should change it after signing in.
            </p>
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
        >
          Invite another member
        </Button>
      </div>
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Adaeze Okonkwo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="adaeze@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="monthlyAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monthly Contribution ({currencySymbol})</FormLabel>
              <FormControl>
                <Input type="number" min="0" step="500" placeholder="e.g. 10000" {...field} />
              </FormControl>
              <FormDescription>
                Their agreed monthly contribution amount, if fixed.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {isOwner && (
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => {
              const selectedRole = ROLES.find((r) => r.value === field.value);

              return (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a role…">
                          {selectedRole ? selectedRole.label : "Select a role…"}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ROLES.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        )}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Sending invite…" : "Send Invite"}
        </Button>
      </form>
    </Form>
  );
}
