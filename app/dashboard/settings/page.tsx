import { getSession } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Account Settings
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Update your name and password
        </p>
      </div>

      <SettingsForm
        currentName={session.user.name}
        email={session.user.email}
      />
    </div>
  );
}
