"use client";

import { useActionState } from "react";
import {
  updateMemberRole,
  removeMember,
  type AdminActionState,
} from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

const ROLES = [
  { value: "MEMBER", label: "Member" },
  { value: "TREASURER", label: "Treasurer" },
  { value: "ADMIN", label: "Admin" },
];

export function RoleChangeForm({
  memberId,
  currentRole,
}: {
  memberId: string;
  currentRole: string;
}) {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(
    updateMemberRole,
    {}
  );
  const [role, setRole] = useState(currentRole);

  if (state.success) {
    return (
      <span className="text-xs text-emerald-600 dark:text-emerald-400">
        Updated
      </span>
    );
  }

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="memberId" value={memberId} />
      <input type="hidden" name="newRole" value={role} />
      <Select value={role} onValueChange={(v) => setRole(v ?? currentRole)}>
        <SelectTrigger className="h-7 text-xs w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ROLES.map(({ value, label }) => (
            <SelectItem key={value} value={value} className="text-xs">
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {role !== currentRole && (
        <Button type="submit" size="xs" disabled={pending}>
          {pending ? "…" : "Save"}
        </Button>
      )}
    </form>
  );
}

export function RemoveMemberForm({ memberId }: { memberId: string }) {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(
    removeMember,
    {}
  );
  const [confirm, setConfirm] = useState(false);

  if (state.success) {
    return (
      <span className="text-xs text-zinc-400 dark:text-zinc-600">Removed</span>
    );
  }

  return (
    <form action={action}>
      <input type="hidden" name="memberId" value={memberId} />
      {confirm ? (
        <div className="flex items-center gap-1.5">
          <Button type="submit" size="xs" variant="destructive" disabled={pending}>
            {pending ? "…" : "Confirm"}
          </Button>
          <Button
            type="button"
            size="xs"
            variant="ghost"
            onClick={() => setConfirm(false)}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          size="xs"
          variant="ghost"
          className="text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
          onClick={() => setConfirm(true)}
        >
          Remove
        </Button>
      )}
    </form>
  );
}
