export const dynamic = "force-dynamic";

import { getCooperatives } from "@/app/actions/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { SignupForm } from "./SignupForm";
import { Header } from "@/app/components/Header";
import Link from "next/link";

export default async function SignupPage() {
  const cooperatives = await getCooperatives();

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-[#0c0c0c]">
      <Header />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-zinc-200 dark:border-zinc-800/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold tracking-tight">Join your cooperative</CardTitle>
            <CardDescription>Create an account and select your cooperative.</CardDescription>
          </CardHeader>
          <CardContent>
            <SignupForm cooperatives={cooperatives} />
            <p className="mt-5 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Already have an account?{" "}
              <Link
                href="/auth/signin"
                className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline underline-offset-4"
              >
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
