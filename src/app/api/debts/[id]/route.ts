import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";

function toNum(v: unknown) {
  return typeof v === "object" && v !== null && "toNumber" in (v as object)
    ? (v as { toNumber(): number }).toNumber()
    : Number(v ?? 0);
}

const UpdateDebtSchema = z.object({
  nome: z.string().min(2).max(100).optional(),
  valor_total: z.number().positive().optional(),
  valor_restante: z.number().min(0).optional(),
  parcelas_total: z.number().int().positive().nullable().optional(),
  parcelas_pagas: z.number().int().min(0).optional(),
  taxa_juros_mensal: z.number().min(0).max(100).nullable().optional(),
  dia_vencimento: z.number().int().min(1).max(31).nullable().optional(),
  escopo: z.enum(["INDIVIDUAL", "COMPARTILHADA"]).optional(),
});

// ─── PUT /api/debts/:id ───────────────────────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { user } = auth;
  const { id } = await params;

  const debt = await prisma.debt.findFirst({
    where: { id, OR: [{ userId: user.id }, { coupleId: user.coupleId ?? undefined }] },
  });

  if (!debt) {
    return NextResponse.json({ error: "debt_not_found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = UpdateDebtSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const {
    nome,
    valor_total,
    valor_restante,
    parcelas_total,
    parcelas_pagas,
    taxa_juros_mensal,
    dia_vencimento,
    escopo,
  } = parsed.data;

  const updated = await prisma.debt.update({
    where: { id },
    data: {
      ...(nome !== undefined && { nome }),
      ...(valor_total !== undefined && { valorTotal: valor_total }),
      ...(valor_restante !== undefined && { valorRestante: valor_restante }),
      ...(parcelas_total !== undefined && { parcelasTotal: parcelas_total }),
      ...(parcelas_pagas !== undefined && { parcelasPagas: parcelas_pagas }),
      ...(taxa_juros_mensal !== undefined && { taxaJuros: taxa_juros_mensal }),
      ...(dia_vencimento !== undefined && { vencimentoDia: dia_vencimento }),
      ...(escopo !== undefined && { escopo }),
    },
  });

  const valorRestante = toNum(updated.valorRestante);
  const valorTotal = toNum(updated.valorTotal);
  const progresso = valorTotal > 0 ? Math.min(((valorTotal - valorRestante) / valorTotal) * 100, 100) : 100;

  return NextResponse.json({ debt: { ...updated, progresso } });
}

// ─── DELETE /api/debts/:id ────────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { user } = auth;
  const { id } = await params;

  const debt = await prisma.debt.findFirst({
    where: { id, OR: [{ userId: user.id }, { coupleId: user.coupleId ?? undefined }] },
  });

  if (!debt) {
    return NextResponse.json({ error: "debt_not_found" }, { status: 404 });
  }

  await prisma.debt.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
