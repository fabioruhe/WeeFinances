import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";

const schema = z.object({
  perfil: z.enum(["POUPADOR", "GASTADOR", "DESLIGADO", "VISIONARIO"]),
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

  await prisma.user.update({
    where: { id: auth.user.id },
    data: { perfilFinanceiro: parsed.data.perfil },
  });

  return NextResponse.json({ ok: true });
}
