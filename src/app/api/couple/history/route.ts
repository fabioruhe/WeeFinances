import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";

export async function GET() {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const pastCouples = await prisma.couple.findMany({
    where: {
      status: "DESVINCULADO",
      OR: [{ userAId: auth.user.id }, { userBId: auth.user.id }],
    },
    include: {
      userA: { select: { id: true, nome: true, email: true } },
      userB: { select: { id: true, nome: true, email: true } },
      checkIns: {
        orderBy: { data: "desc" },
        take: 5,
        select: { id: true, data: true, sentimentoA: true, sentimentoB: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    items: pastCouples,
    message: "Histórico read-only de casais anteriores.",
  });
}
