"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v3";
import { authClient } from "@/app/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
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

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

type FormValues = z.infer<typeof schema>;

export function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  });

  const { isSubmitting } = form.formState;

  if (!token) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Invalid or expired reset link.{" "}
          <Link href="/auth/forgot-password" className="underline underline-offset-4">
            Request a new one
          </Link>
          .
        </AlertDescription>
      </Alert>
    );
  }

  async function onSubmit(values: FormValues) {
    const { error } = await authClient.resetPassword({
      newPassword: values.password,
      token,
    });

    if (error) {
      form.setError("root", {
        message:
          error.message === "INVALID_TOKEN"
            ? "This reset link has expired. Please request a new one."
            : error.message || "Something went wrong.",
      });
    } else {
      router.push("/auth/signin?reset=1");
    }
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
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Min. 8 characters" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirm"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Repeat your password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Set New Password"}
        </Button>
      </form>
    </Form>
  );
}
