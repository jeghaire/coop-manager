"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v3";
import { authClient } from "@/app/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import Link from "next/link";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: FormValues) {
    const { error } = await authClient.requestPasswordReset({
      email: values.email,
      redirectTo: "/auth/reset-password",
    });

    if (error) {
      form.setError("root", {
        message: error.message || "Something went wrong. Please try again.",
      });
    } else {
      setSentTo(values.email);
    }
  }

  if (sentTo) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription>
            Reset link sent to <strong>{sentTo}</strong>. Check your inbox (and spam).
          </AlertDescription>
        </Alert>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
          <Link
            href="/auth/signin"
            className="text-emerald-600 dark:text-emerald-400 hover:underline underline-offset-4"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {form.formState.errors.root && (
          <Alert variant="destructive">
            <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="jane@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Sending…" : "Send Reset Link"}
        </Button>

        <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
          <Link
            href="/auth/signin"
            className="text-emerald-600 dark:text-emerald-400 hover:underline underline-offset-4"
          >
            Back to sign in
          </Link>
        </p>
      </form>
    </Form>
  );
}
