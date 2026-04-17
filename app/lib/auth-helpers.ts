import { auth } from "./auth";
import { prisma } from "./prisma";
import { headers } from "next/headers";

export async function getSession() {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });
  return session;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireCooperativeAccess(cooperativeId: number) {
  const session = await requireAuth();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (user?.cooperativeId !== cooperativeId) {
    throw new Error("Access denied");
  }

  return session;
}

export async function requireAdminRole(session: any) {
  if (session.user.role !== "ADMIN" && session.user.role !== "OWNER") {
    throw new Error("Admin access required");
  }
}
