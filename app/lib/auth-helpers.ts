import { auth } from "./auth";
import prisma from "./prisma";
import { headers } from "next/headers";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");
  return session;
}

export async function requireCooperativeAccess(cooperativeId: string) {
  const session = await requireAuth();

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.cooperativeId !== cooperativeId) {
    throw new Error("Forbidden: Access denied to this cooperative");
  }

  return session;
}

export async function requireAdminRole(
  session: Awaited<ReturnType<typeof requireAuth>>
) {
  const role = session.user.role as string;
  if (role !== "ADMIN" && role !== "OWNER") {
    throw new Error("Forbidden: Admin access required");
  }
}
