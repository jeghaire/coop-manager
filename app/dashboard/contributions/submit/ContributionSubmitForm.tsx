"use client";

import { useActionState, useEffect, useRef, useState, startTransition } from "react";
import {
  submitContribution,
  type ContributionActionState,
} from "@/app/actions/contributions";
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
import { useRouter } from "next/navigation";

const PAYMENT_METHODS = [
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "MOBILE_MONEY", label: "Mobile Money" },
  { value: "CASH", label: "Cash" },
] as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function ContributionSubmitForm() {
  const router = useRouter();
  const [state, formAction] = useActionState<ContributionActionState, FormData>(
    submitContribution,
    {}
  );
  const [paymentMethod, setPaymentMethod] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      router.push("/dashboard/contributions");
    }
  }, [state.success, router]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFileError(null);
    if (selected && selected.size > MAX_FILE_SIZE) {
      setFileError("File must be 10 MB or smaller.");
      e.target.value = "";
      setFile(null);
      return;
    }
    setFile(selected);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formRef.current) return;

    const rawFormData = new FormData(formRef.current);

    if (file) {
      setUploading(true);
      setFileError(null);
      try {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        const res = await fetch(
          `/api/receipts/presign?ext=${encodeURIComponent(ext)}&type=${encodeURIComponent(file.type)}`
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setFileError(body.error ?? "Failed to get upload URL.");
          setUploading(false);
          return;
        }
        const { url, key } = await res.json();

        const putRes = await fetch(url, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });
        if (!putRes.ok) {
          setFileError("Upload failed. Please try again.");
          setUploading(false);
          return;
        }

        rawFormData.set("receiptKey", key);
        rawFormData.set("receiptFileName", file.name);
        rawFormData.set("receiptFileSize", String(file.size));
        rawFormData.set("receiptFileType", file.type);
      } catch {
        setFileError("Upload failed. Please try again.");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    startTransition(() => {
      formAction(rawFormData);
    });
  }

  const pending = uploading;

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="amount">Amount (₦)</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          min="1"
          step="0.01"
          placeholder="e.g. 10000"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="paymentMethod">Payment Method</Label>
        <input type="hidden" name="paymentMethod" value={paymentMethod} />
        <Select
          value={paymentMethod}
          onValueChange={(v) => setPaymentMethod(v ?? "")}
        >
          <SelectTrigger id="paymentMethod">
            <SelectValue placeholder="How did you pay?" />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_METHODS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="receipt">
          Receipt{" "}
          <span className="text-zinc-400 dark:text-zinc-600 font-normal">
            (optional)
          </span>
        </Label>
        <Input
          id="receipt"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,.heic,.heif"
          onChange={handleFileChange}
          className="cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-zinc-100 file:text-zinc-700 dark:file:bg-zinc-800 dark:file:text-zinc-300"
        />
        {file && !fileError && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {file.name}
          </p>
        )}
        {fileError && (
          <p className="text-xs text-red-600 dark:text-red-400">{fileError}</p>
        )}
        {!fileError && !file && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Accepted: images, PDF, HEIC. Max 10 MB.
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={pending || !paymentMethod}
      >
        {uploading ? "Uploading…" : "Submit Contribution"}
      </Button>
    </form>
  );
}
