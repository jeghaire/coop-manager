"use client";

import { useActionState, startTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v3";
import { signUpUser, type SignUpState } from "@/app/actions/auth";
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
  FormMessage,
  FormDescription,
} from "@/components/ui/form";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  cooperativeId: z.string().min(1, "Please select a cooperative"),
});

type FormValues = z.infer<typeof schema>;
type Cooperative = { id: string; name: string };

export function SignupForm({ cooperatives }: { cooperatives: Cooperative[] }) {
  const [state, action, pending] = useActionState<SignUpState, FormData>(signUpUser, {});
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", cooperativeId: "" },
  });

  function onSubmit(values: FormValues) {
    const fd = new FormData();
    fd.set("name", values.name);
    fd.set("email", values.email);
    fd.set("password", values.password);
    fd.set("cooperativeId", values.cooperativeId);
    startTransition(() => action(fd));
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                <Input placeholder="Jane Doe" {...field} />
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
                <Input type="password" placeholder="Min. 8 characters" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cooperativeId"
          render={({ field }) => {
            const selectedCooperative = cooperatives.find((c) => c.id === field.value);

            return (
              <FormItem>
                <FormLabel>Cooperative</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your cooperative…">
                        {selectedCooperative ? selectedCooperative.name : "Select your cooperative…"}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {cooperatives.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {cooperatives.length === 0 && (
                  <FormDescription>
                    No cooperatives available. Contact your administrator.
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creating account…" : "Create Account"}
        </Button>
      </form>
    </Form>
  );
}
