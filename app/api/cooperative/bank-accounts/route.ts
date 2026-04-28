import { type NextRequest } from "next/server";
import prisma from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cooperativeId = request.nextUrl.searchParams.get("cooperativeId");

  if (!cooperativeId) {
    return Response.json({ error: "cooperativeId is required" }, { status: 400 });
  }

  const accounts = await prisma.cooperativeBank.findMany({
    where: { cooperativeId },
    orderBy: { isPreferred: "desc" },
    select: {
      id: true,
      accountName: true,
      accountNumber: true,
      bankName: true,
      isPreferred: true,
    },
  });

  return Response.json(accounts);
}
