"use client";

import { useState } from "react";
import { authClient } from "@/app/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function SettingsForm({
  currentName,
  email,
}: {
  currentName: string;
  email: string;
}) {
  const [name, setName] = useState(currentName);
  const [nameMsg, setNameMsg] = useState("");
  const [namePending, setNamePending] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwPending, setPwPending] = useState(false);

  async function handleNameSave(e: React.FormEvent) {
    e.preventDefault();
    setNameMsg("");
    setNamePending(true);

    const { error } = await authClient.updateUser({ name });
    setNamePending(false);

    if (error) {
      setNameMsg("Failed to update name.");
    } else {
      setNameMsg("Name updated.");
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg("");
    setPwError("");

    if (newPw.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      setPwError("Passwords do not match.");
      return;
    }

    setPwPending(true);

    const { error } = await authClient.changePassword({
      currentPassword: currentPw,
      newPassword: newPw,
      revokeOtherSessions: false,
    });

    setPwPending(false);

    if (error) {
      setPwError(
        error.message?.toLowerCase().includes("incorrect") ||
          error.message?.toLowerCase().includes("invalid")
          ? "Current password is incorrect."
          : error.message || "Failed to change password."
      );
    } else {
      setPwMsg("Password updated.");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile section */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Profile
        </h2>

        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input value={email} disabled className="opacity-60" />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Email cannot be changed.
          </p>
        </div>

        <form onSubmit={handleNameSave} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          {nameMsg && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              {nameMsg}
            </p>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={namePending || name === currentName}
          >
            {namePending ? "Saving…" : "Save Name"}
          </Button>
        </form>
      </div>

      {/* Password section */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Change Password
        </h2>

        <form onSubmit={handlePasswordSave} className="space-y-4">
          {pwError && (
            <Alert variant="destructive">
              <AlertDescription>{pwError}</AlertDescription>
            </Alert>
          )}
          {pwMsg && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              {pwMsg}
            </p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="currentPw">Current Password</Label>
            <Input
              id="currentPw"
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newPw">New Password</Label>
            <Input
              id="newPw"
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="Min. 8 characters"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPw">Confirm New Password</Label>
            <Input
              id="confirmPw"
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              required
            />
          </div>
          <Button type="submit" size="sm" disabled={pwPending}>
            {pwPending ? "Saving…" : "Update Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
