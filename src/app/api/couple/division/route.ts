import { NextResponse } from "next/server";
import { z } from "zod";

import { getActiveCouple } from "@/lib/couple";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";

const divisionSchema = z.object({
  divisaoTipo: z.enum(["PROPORCIONAL", "IGUALITARIA", "FIXA"]),
});

export async function POST(request: Request) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const activeCouple = await getActiveCouple(auth.user.id);
  if (!activeCouple) {
    return NextResponse.json(
      { error: "couple_not_active", message: "Sua conta está em modo solo." },
      { status: 409 },
    );
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = divisionSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", details: parsed.error.flatten() }, { status: 400 });
  }

  await prisma.couple.update({
    where: { id: activeCouple.id },
    data: { divisaoTipo: parsed.data.divisaoTipo },
  });

  return NextResponse.json({
    success: true,
    coupleId: activeCouple.id,
    divisaoTipo: parsed.data.divisaoTipo,
    message: "Tipo de divisão atualizado com sucesso.",
  });
}
