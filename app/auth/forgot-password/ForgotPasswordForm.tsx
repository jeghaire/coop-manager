"use client";

import { useState } from "react";
import { authClient } from "@/app/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);

    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: "/auth/reset-password",
    });

    setPending(false);

    if (error) {
      setError(error.message || "Something went wrong. Please try again.");
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription>
            Reset link sent to <strong>{email}</strong>. Check your inbox (and
            spam).
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jane@example.com"
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Send Reset Link"}
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
  );
}
