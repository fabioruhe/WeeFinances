import { NextResponse } from "next/server";

import { createInviteCode, getActiveCouple, getPendingCouple } from "@/lib/couple";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";

export async function POST() {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const activeCouple = await getActiveCouple(auth.user.id);
  if (activeCouple) {
    return NextResponse.json(
      { error: "already_in_couple", message: "Você já está em modo casal com uma vinculação ativa." },
      { status: 409 },
    );
  }

  const pending = await getPendingCouple(auth.user.id);
  if (pending) {
    return NextResponse.json({
      invite: { code: pending.inviteCode, coupleId: pending.id, expiresAt: null },
      reused: true,
      message: "Convite pendente reutilizado.",
    });
  }

  let code = createInviteCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const exists = await prisma.couple.findUnique({ where: { inviteCode: code } });
    if (!exists) break;
    code = createInviteCode();
  }

  const couple = await prisma.couple.create({
    data: {
      userAId: auth.user.id,
      inviteCode: code,
      status: "PENDENTE",
    },
  });

  return NextResponse.json(
    {
      invite: { code: couple.inviteCode, coupleId: couple.id },
      reused: false,
      message: "Convite criado com sucesso. Compartilhe o código com seu parceiro(a).",
    },
    { status: 201 },
  );
}
