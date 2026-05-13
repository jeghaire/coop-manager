"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  startTransition,
} from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v3";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

const PAYMENT_METHODS = [
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "MOBILE_MONEY", label: "Mobile Money" },
  { value: "CASH", label: "Cash" },
] as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const schema = z.object({
  amount: z.coerce.number().min(1, "Amount must be at least 1"),
  paymentMethod: z.string().min(1, "Please select a payment method"),
});

type FormValues = z.infer<typeof schema>;

export function ContributionSubmitForm({
  onSuccess,
  currencySymbol,
}: {
  onSuccess?: () => void;
  currencySymbol?: string;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<ContributionActionState, FormData>(
    submitContribution,
    {}
  );
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: undefined, paymentMethod: "" },
  });

  useEffect(() => {
    if (state.success) {
      onSuccess?.();
      router.push("/dashboard/contributions");
    }
  }, [state.success, router, onSuccess]);

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

  async function onSubmit(values: FormValues) {
    const fd = new FormData();
    fd.set("amount", String(values.amount));
    fd.set("paymentMethod", values.paymentMethod);

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
          const text = await putRes.text().catch(() => "");
          console.error("R2 PUT failed", putRes.status, text);
          setFileError(`Upload failed (${putRes.status}). Please try again.`);
          setUploading(false);
          return;
        }

        fd.set("receiptKey", key);
        fd.set("receiptFileName", file.name);
        fd.set("receiptFileSize", String(file.size));
        fd.set("receiptFileType", file.type);
      } catch (err) {
        console.error("Upload error:", err);
        const msg =
          err instanceof TypeError
            ? "Network error — check R2 CORS settings."
            : "Upload failed. Please try again.";
        setFileError(msg);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    startTransition(() => {
      formAction(fd);
    });
  }

  const pending = uploading || form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount ({currencySymbol})</FormLabel>
              <FormControl>
                <Input type="number" min="1" step="0.01" placeholder="e.g. 10000" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => {
            const selectedMethod = PAYMENT_METHODS.find((m) => m.value === field.value);

            return (
              <FormItem>
                <FormLabel>Payment Method</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="How did you pay?">
                        {selectedMethod ? selectedMethod.label : "How did you pay?"}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Payment Methods</SelectLabel>
                      {PAYMENT_METHODS.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <div className="space-y-1.5">
          <Label htmlFor="receipt">
            Receipt{" "}
            <span className="text-zinc-400 dark:text-zinc-600 font-normal">(optional)</span>
          </Label>
          <Input
            id="receipt"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,.heic,.heif"
            onChange={handleFileChange}
            className="cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-zinc-100 file:text-zinc-700 dark:file:bg-zinc-800 dark:file:text-zinc-300"
          />
          {file && !fileError && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{file.name}</p>
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

        <Button type="submit" className="w-full" disabled={pending}>
          {uploading ? "Uploading…" : "Submit Contribution"}
        </Button>
      </form>
    </Form>
  );
}
