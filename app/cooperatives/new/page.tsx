"use client";

import { useActionState } from "react";
import { createCooperative, type CreateCoopState } from "@/app/actions/cooperative";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

export default function NewCooperativePage() {
  const [state, action, pending] = useActionState<CreateCoopState, FormData>(
    createCooperative,
    {}
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0c0c0c] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / wordmark */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Cooperative<span className="text-emerald-500">Manager</span>
            </span>
          </Link>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            Set up your cooperative in under a minute.
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-2xl p-7 shadow-sm">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-5">
            Create your cooperative
          </h1>

          <form action={action} className="space-y-5">
            {state.error && (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}

            <fieldset className="space-y-4">
              <legend className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-3">
                Cooperative
              </legend>
              <div className="space-y-1.5">
                <Label htmlFor="coopName">Cooperative Name</Label>
                <Input
                  id="coopName"
                  name="coopName"
                  placeholder="Lagos Savings & Credit Cooperative"
                  required
                />
              </div>
            </fieldset>

            <hr className="border-zinc-100 dark:border-zinc-800" />

            <fieldset className="space-y-4">
              <legend className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-3">
                Your Account (Owner)
              </legend>
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Amara Okafor"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="amara@example.com"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Min. 8 characters"
                  required
                />
              </div>
            </fieldset>

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Setting up…" : "Create Cooperative"}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-5">
          Already have an account?{" "}
          <Link
            href="/auth/signin"
            className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
