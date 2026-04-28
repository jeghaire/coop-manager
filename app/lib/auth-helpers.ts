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

export async function requireVerified() {
  const session = await requireAuth();
  const role = session.user.role as string;

  // Non-members bypass verification
  if (role !== "MEMBER") return session;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { verifiedAt: true },
  });

  if (!user?.verifiedAt) {
    throw new Error("Account pending verification.");
  }

  return session;
}

export async function protectVerifiedAction(cooperativeId: string) {
  const session = await requireAuth();
  const role = session.user.role as string;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { cooperativeId: true, verifiedAt: true },
  });

  if (!user || user.cooperativeId !== cooperativeId) {
    throw new Error("Forbidden: Access denied to this cooperative");
  }

  if (role === "MEMBER" && !user.verifiedAt) {
    throw new Error("Account not verified. Please wait for owner approval.");
  }

  return session;
}

export async function protectAdminAction(cooperativeId: string) {
  const session = await requireAuth();
  const role = session.user.role as string;

  if (role !== "ADMIN" && role !== "OWNER") {
    throw new Error("Forbidden: Admin access required");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { cooperativeId: true },
  });

  if (!user || user.cooperativeId !== cooperativeId) {
    throw new Error("Forbidden: Access denied to this cooperative");
  }

  return session;
}

export async function getTotalContributed(userId: string): Promise<number> {
  const contributions = await prisma.contribution.findMany({
    where: { userId, status: "VERIFIED", deletedAt: null },
    select: { amount: true },
  });
  return contributions.reduce((sum, c) => sum + Number(c.amount), 0);
}
