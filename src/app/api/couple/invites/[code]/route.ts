import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ code: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { code } = await context.params;

  const couple = await prisma.couple.findUnique({
    where: { inviteCode: code.toUpperCase() },
    include: {
      userA: { select: { id: true, nome: true, email: true } },
    },
  });

  if (!couple) {
    return NextResponse.json(
      { error: "invite_not_found", message: "Código de convite inválido." },
      { status: 404 },
    );
  }

  if (couple.status !== "PENDENTE") {
    return NextResponse.json(
      { error: "invite_unavailable", message: "Este convite não está mais disponível.", status: couple.status },
      { status: 409 },
    );
  }

  return NextResponse.json({
    code: couple.inviteCode,
    coupleId: couple.id,
    inviter: couple.userA,
    status: couple.status,
  });
}
