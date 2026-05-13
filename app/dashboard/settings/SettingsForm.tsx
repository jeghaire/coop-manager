"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v3";
import { authClient } from "@/app/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useState } from "react";

const nameSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

const passwordSchema = z
  .object({
    currentPw: z.string().min(1, "Current password is required"),
    newPw: z.string().min(8, "New password must be at least 8 characters"),
    confirmPw: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.newPw === d.confirmPw, {
    message: "Passwords do not match",
    path: ["confirmPw"],
  });

type NameValues = z.infer<typeof nameSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

export function SettingsForm({
  currentName,
  email,
}: {
  currentName: string;
  email: string;
}) {
  const [nameMsg, setNameMsg] = useState("");
  const [pwMsg, setPwMsg] = useState("");

  const nameForm = useForm<NameValues>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: currentName },
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPw: "", newPw: "", confirmPw: "" },
  });

  async function onNameSubmit(values: NameValues) {
    setNameMsg("");
    const { error } = await authClient.updateUser({ name: values.name });
    if (error) {
      nameForm.setError("root", { message: "Failed to update name." });
    } else {
      setNameMsg("Name updated.");
    }
  }

  async function onPasswordSubmit(values: PasswordValues) {
    setPwMsg("");
    const { error } = await authClient.changePassword({
      currentPassword: values.currentPw,
      newPassword: values.newPw,
      revokeOtherSessions: false,
    });

    if (error) {
      const message =
        error.message?.toLowerCase().includes("incorrect") ||
        error.message?.toLowerCase().includes("invalid")
          ? "Current password is incorrect."
          : error.message || "Failed to change password.";
      passwordForm.setError("root", { message });
    } else {
      setPwMsg("Password updated.");
      passwordForm.reset();
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile section */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Profile
        </h2>

        <div className="space-y-1.5">
          <Label htmlFor="email-display">Email</Label>
          <Input
            id="email-display"
            value={email}
            disabled
            className="opacity-60"
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Email cannot be changed.
          </p>
        </div>

        <Form {...nameForm}>
          <form
            onSubmit={nameForm.handleSubmit(onNameSubmit)}
            className="space-y-3"
          >
            <FormField
              control={nameForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {nameForm.formState.errors.root && (
              <p className="text-sm text-destructive">
                {nameForm.formState.errors.root.message}
              </p>
            )}
            {nameMsg && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                {nameMsg}
              </p>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={
                nameForm.formState.isSubmitting || !nameForm.formState.isDirty
              }
            >
              {nameForm.formState.isSubmitting ? "Saving…" : "Save Name"}
            </Button>
          </form>
        </Form>
      </div>

      {/* Password section */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Change Password
        </h2>

        <Form {...passwordForm}>
          <form
            onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
            className="space-y-4"
          >
            {passwordForm.formState.errors.root && (
              <Alert variant="destructive">
                <AlertDescription>
                  {passwordForm.formState.errors.root.message}
                </AlertDescription>
              </Alert>
            )}
            {pwMsg && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                {pwMsg}
              </p>
            )}

            <FormField
              control={passwordForm.control}
              name="currentPw"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={passwordForm.control}
              name="newPw"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Min. 8 characters"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={passwordForm.control}
              name="confirmPw"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              size="sm"
              disabled={passwordForm.formState.isSubmitting}
            >
              {passwordForm.formState.isSubmitting
                ? "Saving…"
                : "Update Password"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
