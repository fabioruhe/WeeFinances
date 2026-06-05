import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";

export async function GET() {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const couple = auth.user.coupleId
    ? await prisma.couple.findUnique({
        where: { id: auth.user.coupleId },
        select: { status: true, inviteCode: true },
      })
    : null;

  return NextResponse.json({
    coupleId: auth.user.coupleId,
    coupleStatus: couple?.status ?? null,
    coupleMode: couple?.status === "ATIVO",
    inviteCode: couple?.inviteCode ?? null,
  });
}
