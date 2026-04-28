import { getSession } from "@/app/lib/auth-helpers";
import prisma from "@/app/lib/prisma";
import { redirect } from "next/navigation";

export default async function LoansLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const role = session.user.role as string;

  if (role === "MEMBER") {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { verifiedAt: true },
    });

    if (!user?.verifiedAt) {
      redirect("/dashboard/verification-pending");
    }
  }

  return <>{children}</>;
}
