import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const rows = await prisma.cooperative.findMany({
    where: { deletedAt: null, subscriptionStatus: "ACTIVE" },
    select: {
      id: true,
      name: true,
      _count: { select: { users: { where: { deletedAt: null } } } }
    },
    orderBy: { name: "asc" }
  });

  const cooperatives = rows.map(({ id, name, _count }) => ({
    id,
    name,
    memberCount: _count.users
  }));

  return NextResponse.json(cooperatives);
}
