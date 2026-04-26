"use client";

import { useActionState, useState } from "react";
import { inviteMember, type AdminActionState } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROLES = [
  { value: "MEMBER", label: "Member" },
  { value: "TREASURER", label: "Treasurer" },
  { value: "ADMIN", label: "Admin" },
];

export function InviteMemberForm({ isOwner }: { isOwner: boolean }) {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(
    inviteMember,
    {}
  );
  const [role, setRole] = useState("MEMBER");

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
    <form action={action} className="space-y-5">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" name="name" placeholder="Adaeze Okonkwo" required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="adaeze@example.com"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="monthlyAmount">Monthly Contribution (₦)</Label>
        <Input
          id="monthlyAmount"
          name="monthlyAmount"
          type="number"
          min="0"
          step="500"
          placeholder="e.g. 10000"
          defaultValue="0"
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Their agreed monthly contribution amount, if fixed.
        </p>
      </div>

      {isOwner && (
        <div className="space-y-1.5">
          <Label htmlFor="role">Role</Label>
          <input type="hidden" name="role" value={role} />
          <Select value={role} onValueChange={(v) => setRole(v ?? "MEMBER")}>
            <SelectTrigger id="role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending invite…" : "Send Invite"}
      </Button>
    </form>
  );
}
