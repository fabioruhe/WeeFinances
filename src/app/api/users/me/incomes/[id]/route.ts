import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";

// ─── PATCH /api/users/me/incomes/:id ─────────────────────────────────────────

const UpdateIncomeSchema = z.object({
  valor: z.number().positive().optional(),
  tipo: z.enum(["FIXO", "VARIAVEL", "EXTRAORDINARIO"]).optional(),
  descricao: z.string().max(200).nullable().optional(),
  mesReferencia: z
    .string()
    .refine((d) => !isNaN(new Date(d).getTime()), "Data invalida")
    .optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { user } = auth;
  const { id } = await params;

  const existing = await prisma.income.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = UpdateIncomeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { mesReferencia: mesStr, ...rest } = parsed.data;
  let mesData = {};
  if (mesStr) {
    const d = new Date(mesStr);
    mesData = { mesReferencia: new Date(d.getFullYear(), d.getMonth(), 1) };
  }

  const updated = await prisma.income.update({
    where: { id },
    data: { ...rest, ...mesData },
  });

  return NextResponse.json(updated);
}

// ─── DELETE /api/users/me/incomes/:id ────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { user } = auth;
  const { id } = await params;

  const existing = await prisma.income.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.income.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
