import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const cooperatives = await prisma.cooperative.findMany({
    where: { deletedAt: null, subscriptionStatus: "ACTIVE" },
    select: {
      id: true,
      name: true,
      _count: { select: { users: { where: { deletedAt: null } } } }
    },
    orderBy: { name: "asc" }
  });

  return NextResponse.json(
    cooperatives.map((c: typeof cooperatives[number]) => ({
      id: c.id,
      name: c.name,
      memberCount: c._count.users
    }))
  );
}
