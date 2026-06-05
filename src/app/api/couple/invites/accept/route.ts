import { NextResponse } from "next/server";
import { z } from "zod";

import { getActiveCouple } from "@/lib/couple";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";

const acceptInviteSchema = z.object({
  code: z.string().trim().min(4),
});

export async function POST(request: Request) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const payload = await request.json().catch(() => ({}));
  const parsed = acceptInviteSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const alreadyInCouple = await getActiveCouple(auth.user.id);
  if (alreadyInCouple) {
    return NextResponse.json(
      { error: "already_in_couple", message: "Sua conta já está em modo casal." },
      { status: 409 },
    );
  }

  const couple = await prisma.couple.findUnique({
    where: { inviteCode: parsed.data.code.toUpperCase() },
    include: { userA: { select: { id: true, email: true } } },
  });

  if (!couple) {
    return NextResponse.json({ error: "invite_not_found", message: "Código de convite inválido." }, { status: 404 });
  }

  if (couple.status !== "PENDENTE") {
    return NextResponse.json(
      { error: "invite_unavailable", message: "Convite expirado ou já utilizado." },
      { status: 409 },
    );
  }

  if (couple.userAId === auth.user.id) {
    return NextResponse.json(
      { error: "invalid_invite", message: "Você não pode aceitar seu próprio convite." },
      { status: 400 },
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.couple.update({
      where: { id: couple.id },
      data: { userBId: auth.user.id, status: "ATIVO" },
    });

    await tx.user.updateMany({
      where: { id: { in: [couple.userAId, auth.user.id] } },
      data: { coupleId: couple.id },
    });

    await tx.transaction.updateMany({
      where: { userId: couple.userAId, coupleId: null },
      data: { coupleId: couple.id },
    });
    await tx.goal.updateMany({
      where: { userId: couple.userAId, coupleId: null },
      data: { coupleId: couple.id },
    });
    await tx.debt.updateMany({
      where: { userId: couple.userAId, coupleId: null },
      data: { coupleId: couple.id },
    });
    await tx.creditCard.updateMany({
      where: { userId: couple.userAId, coupleId: null },
      data: { coupleId: couple.id },
    });
  });

  return NextResponse.json({
    success: true,
    message: "Modo casal ativado com sucesso. Nenhum dado individual foi perdido.",
    coupleId: couple.id,
    nextStep: "Configure a divisão de despesas em Configurações > Relacionamento.",
  });
}
