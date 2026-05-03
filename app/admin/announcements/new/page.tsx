import { getSession } from "@/app/lib/auth-helpers";
import { redirect } from "next/navigation";
import { NewAnnouncementForm } from "./NewAnnouncementForm";

export default async function NewAnnouncementPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  const role = session.user.role as string;
  if (role !== "ADMIN" && role !== "OWNER") redirect("/dashboard");

  const cooperativeId = session.user.cooperativeId as string;

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          New Announcement
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Create an announcement and notify members.
        </p>
      </div>
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-6">
        <NewAnnouncementForm cooperativeId={cooperativeId} />
      </div>
    </div>
  );
}
