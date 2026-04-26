"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/app/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

export function SigninForm({ registered, reset }: { registered?: boolean; reset?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setPending(true);

    const data = new FormData(e.currentTarget);
    const email = data.get("email") as string;
    const password = data.get("password") as string;

    await signIn.email(
      { email, password },
      {
        onSuccess: () => router.push("/dashboard"),
        onError: (ctx) => {
          if (ctx.error.status === 403) {
            setError("Please verify your email address before signing in.");
          } else {
            setError(ctx.error.message || "Invalid email or password.");
          }
          setPending(false);
        }
      }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {registered && (
        <Alert>
          <AlertDescription>Account created! Sign in to continue.</AlertDescription>
        </Alert>
      )}
      {reset && (
        <Alert>
          <AlertDescription>Password updated. Sign in with your new password.</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="jane@example.com"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required />
      </div>

      <div className="flex items-center justify-end">
        <Link
          href="/auth/forgot-password"
          className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          Forgot password?
        </Link>
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign In"}
      </Button>
    </form>
  );
}
