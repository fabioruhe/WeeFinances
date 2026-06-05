import { NextResponse } from "next/server";
import { z } from "zod";

import { getActiveCouple } from "@/lib/couple";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";

const schema = z.object({
  divisaoTipo: z.enum(["PROPORCIONAL", "IGUALITARIA", "FIXA"]),
});

export async function GET() {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const couple = await getActiveCouple(auth.user.id);
  if (!couple) {
    return NextResponse.json(
      { error: "couple_not_active", message: "Você precisa estar em modo casal para configurar a divisão." },
      { status: 409 },
    );
  }

  const [incomeA, incomeB] = await Promise.all([
    prisma.income.findFirst({
      where: { userId: couple.userAId },
      orderBy: { mesReferencia: "desc" },
      select: { valor: true, tipo: true },
    }),
    couple.userBId
      ? prisma.income.findFirst({
          where: { userId: couple.userBId },
          orderBy: { mesReferencia: "desc" },
          select: { valor: true, tipo: true },
        })
      : null,
  ]);

  return NextResponse.json({
    userA: {
      id: couple.userAId,
      nome: couple.userA.nome ?? couple.userA.email ?? "Parceiro A",
      income: incomeA ? Number(incomeA.valor) : null,
      incomeTipo: incomeA?.tipo ?? null,
    },
    userB: couple.userBId
      ? {
          id: couple.userBId,
          nome: couple.userB?.nome ?? couple.userB?.email ?? "Parceiro B",
          income: incomeB ? Number(incomeB.valor) : null,
          incomeTipo: incomeB?.tipo ?? null,
        }
      : null,
    divisaoTipo: couple.divisaoTipo,
    coupleId: couple.id,
  });
}

export async function POST(request: Request) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const couple = await getActiveCouple(auth.user.id);
  if (!couple) {
    return NextResponse.json(
      { error: "couple_not_active", message: "Você precisa estar em modo casal para configurar a divisão." },
      { status: 409 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  await prisma.$transaction([
    prisma.couple.update({
      where: { id: couple.id },
      data: { divisaoTipo: parsed.data.divisaoTipo },
    }),
    prisma.user.update({
      where: { id: auth.user.id },
      data: { onboardingCompleto: true },
    }),
  ]);

  return NextResponse.json({ ok: true, divisaoTipo: parsed.data.divisaoTipo });
}
