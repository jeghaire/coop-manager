import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Header } from "@/app/components/Header";
import { ResetForm } from "./ResetForm";
import { Suspense } from "react";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-[#0c0c0c]">
      <Header />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-zinc-200 dark:border-zinc-800/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold tracking-tight">
              Set new password
            </CardTitle>
            <CardDescription>Choose a password you haven&apos;t used before.</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
              <ResetForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
