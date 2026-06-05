import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";

const UpdateContaSchema = z.object({
  nome: z.string().min(2).max(100).optional(),
  tipo: z.enum(["CORRENTE", "POUPANCA", "INVESTIMENTO", "CARTEIRA_DIGITAL", "OUTRO"]).optional(),
  banco: z.string().min(1).max(100).optional(),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  saldo: z.number().optional().nullable(),
  icone: z.string().max(50).optional().nullable(),
  padrao: z.boolean().optional(),
});

function toNum(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  return typeof v === "object" && "toNumber" in (v as object)
    ? (v as { toNumber(): number }).toNumber()
    : Number(v);
}

// ─── PATCH /api/contas/:id ───────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateContaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const conta = await prisma.bankAccount.findUnique({ where: { id } });
  if (!conta || conta.userId !== auth.user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { nome, tipo, banco, cor, saldo, icone, padrao } = parsed.data;
  const { user, coupleId, isCouple } = auth;

  const updated = await prisma.$transaction(async (tx) => {
    if (padrao === true) {
      const ownerWhere = isCouple && coupleId
        ? { coupleId, ativo: true }
        : { userId: user.id, coupleId: null, ativo: true };
      await tx.bankAccount.updateMany({
        where: { ...ownerWhere, padrao: true, id: { not: id } },
        data: { padrao: false },
      });
    }

    return tx.bankAccount.update({
      where: { id },
      data: {
        ...(nome !== undefined && { nome }),
        ...(tipo !== undefined && { tipo }),
        ...(banco !== undefined && { banco }),
        ...(cor !== undefined && { cor }),
        ...(saldo !== undefined && { saldo: saldo ?? null }),
        ...(icone !== undefined && { icone: icone ?? null }),
        ...(padrao !== undefined && { padrao }),
      },
    });
  });

  return NextResponse.json({
    conta: {
      id: updated.id,
      nome: updated.nome,
      tipo: updated.tipo,
      banco: updated.banco,
      cor: updated.cor,
      saldo: toNum(updated.saldo),
      icone: updated.icone,
      padrao: updated.padrao,
      ativo: updated.ativo,
      createdAt: updated.createdAt.toISOString(),
    },
  });
}

// ─── DELETE /api/contas/:id ──────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const conta = await prisma.bankAccount.findUnique({ where: { id } });
  if (!conta || conta.userId !== auth.user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.bankAccount.update({ where: { id }, data: { ativo: false } });

  return NextResponse.json({ ok: true });
}
