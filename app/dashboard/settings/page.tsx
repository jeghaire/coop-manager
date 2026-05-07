import { getSession } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import { SettingsForm } from "./SettingsForm";
import { NotificationSettingsForm } from "./NotificationSettingsForm";
import { PageHeader } from "@/app/components/PageHeader";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { phoneNumber: true, emailNotifications: true, smsNotifications: true },
  });

  return (
    <div className="max-w-lg space-y-8">
      <PageHeader
        title="Settings"
        description="Update your name, password, and notification preferences"
      />

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
