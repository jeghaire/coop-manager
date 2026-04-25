import { headers } from "next/headers";
import { auth } from "./auth";
import prisma from "./prisma";

export async function requireCooperativeAccess(cooperativeId: string | number) {
  const headersList = await headers();

  // Get session
  const session = await auth.api.getSession({
    headers: headersList
  });

  if (!session?.user) {
    throw new Error("Unauthorized: No session");
  }

  // Get user from database to verify cooperativeId
  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  if (!user) {
    throw new Error("Unauthorized: User not found");
  }

  // Convert to string for comparison
  const userCoopId = String(user.cooperativeId);
  const requestedCoopId = String(cooperativeId);

  if (userCoopId !== requestedCoopId) {
    throw new Error("Forbidden: Access denied to this cooperative");
  }

  return session;
}

export async function requireAdminRole(session: any) {
  if (session.user.role !== "ADMIN" && session.user.role !== "OWNER") {
    throw new Error("Forbidden: Admin access required");
  }
}

export async function requireRole(session: any, role: string) {
  if (session.user.role !== role) {
    throw new Error(`Forbidden: ${role} access required`);
  }
}
