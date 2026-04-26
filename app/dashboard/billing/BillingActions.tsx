"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function BillingActions({
  status,
  hasSubscription,
  billingEnabled,
}: {
  status: string;
  hasSubscription: boolean;
  billingEnabled: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function goToCheckout() {
    setLoading(true);
    const res = await fetch("/api/billing/checkout", { method: "POST" });
    const { url, error } = await res.json();
    if (url) window.location.href = url;
    else {
      alert(error ?? "Failed to start checkout.");
      setLoading(false);
    }
  }

  async function goToPortal() {
    setLoading(true);
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const { url, error } = await res.json();
    if (url) window.location.href = url;
    else {
      alert(error ?? "Failed to open billing portal.");
      setLoading(false);
    }
  }

  if (!billingEnabled) return null;

  if (hasSubscription) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={goToPortal}
        disabled={loading}
      >
        {loading ? "Redirecting…" : "Manage Subscription"}
      </Button>
    );
  }

  return (
    <Button size="sm" onClick={goToCheckout} disabled={loading}>
      {loading ? "Redirecting…" : "Subscribe — £500/year"}
    </Button>
  );
}
