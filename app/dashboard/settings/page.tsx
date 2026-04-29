import { getSession } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import { SettingsForm } from "./SettingsForm";
import { NotificationSettingsForm } from "./NotificationSettingsForm";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { phoneNumber: true, emailNotifications: true, smsNotifications: true },
  });

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Account Settings
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Update your name, password, and notification preferences
        </p>
      </div>

      <SettingsForm
        currentName={session.user.name}
        email={session.user.email}
      />

      <NotificationSettingsForm
        phoneNumber={dbUser?.phoneNumber ?? null}
        emailNotifications={dbUser?.emailNotifications ?? true}
        smsNotifications={dbUser?.smsNotifications ?? true}
      />
    </div>
  );
}
