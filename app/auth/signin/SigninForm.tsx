"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v3";
import { signIn } from "@/app/lib/auth-client";
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
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export function SigninForm({ registered, reset }: { registered?: boolean; reset?: boolean }) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: FormValues) {
    await signIn.email(
      { email: values.email, password: values.password },
      {
        onSuccess: () => router.push("/dashboard"),
        onError: (ctx) => {
          const message =
            ctx.error.status === 403
              ? "Please verify your email address before signing in."
              : ctx.error.message || "Invalid email or password.";
          form.setError("root", { message });
        },
      }
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-end">
          <Link
            href="/auth/forgot-password"
            className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign In"}
        </Button>
      </form>
    </Form>
  );
}
