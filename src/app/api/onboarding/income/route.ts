import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";

const schema = z.object({
  valor: z.number().positive("Valor deve ser positivo"),
  tipo: z.enum(["FIXO", "VARIAVEL"]),
});

export async function POST(request: Request) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const now = new Date();
  const mesReferencia = new Date(now.getFullYear(), now.getMonth(), 1);

  await prisma.income.create({
    data: {
      userId: auth.user.id,
      valor: parsed.data.valor,
      tipo: parsed.data.tipo,
      mesReferencia,
    },
  });

  // Verifica se o usuário está em modo casal ativo para informar o próximo passo
  const couple = auth.user.coupleId
    ? await prisma.couple.findUnique({
        where: { id: auth.user.coupleId },
        select: { status: true },
      })
    : null;

  const coupleMode = couple?.status === "ATIVO";

  return NextResponse.json({ ok: true, coupleMode });
}
