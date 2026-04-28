"use client";

import { useActionState } from "react";
import { signUpUser, type SignUpState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useState } from "react";

type Cooperative = { id: string; name: string };

export function SignupForm({ cooperatives }: { cooperatives: Cooperative[] }) {
  const [state, action, pending] = useActionState<SignUpState, FormData>(
    signUpUser,
    {}
  );
  const [cooperativeId, setCooperativeId] = useState("");

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" name="name" placeholder="Jane Doe" required />
      </div>

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
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Min. 8 characters"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cooperative">Cooperative</Label>
        {/* Hidden input carries the value to FormData */}
        <input type="hidden" name="cooperativeId" value={cooperativeId} />
        <Select value={cooperativeId} onValueChange={(v) => setCooperativeId(v ?? "")} required>
          <SelectTrigger id="cooperative">
            <SelectValue>
              {cooperativeId
                ? (cooperatives.find((c) => c.id === cooperativeId)?.name ?? "Select your cooperative")
                : "Select your cooperative"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {cooperatives.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {cooperatives.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No cooperatives available. Contact your administrator.
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create Account"}
      </Button>
    </form>
  );
}
