import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { SigninForm } from "./SigninForm";
import { Header } from "@/app/components/Header";
import Link from "next/link";

export default async function SigninPage({
  searchParams
}: {
  searchParams: Promise<{ registered?: string; reset?: string }>;
}) {
  const { registered, reset } = await searchParams;

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-[#0c0c0c]">
      <Header />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-zinc-200 dark:border-zinc-800/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold tracking-tight">Sign in</CardTitle>
            <CardDescription>Access your cooperative dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <SigninForm registered={registered === "1"} reset={reset === "1"} />
            <p className="mt-5 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/signup"
                className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline underline-offset-4"
              >
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
