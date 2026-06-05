import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";
import {
  parseMesStr,
  mesReferenciaDate,
  getCategoriaGrupo,
  computeStatus,
  STATUS_ORDER,
} from "@/lib/budget-utils";

// ─── GET /api/budgets?mes=2026-04 ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { user, coupleId } = auth;
  const { year, month } = parseMesStr(req.nextUrl.searchParams.get("mes"));
  const mesRef = mesReferenciaDate(year, month);
  const mesStart = new Date(year, month - 1, 1);
  const mesEnd = new Date(year, month, 0, 23, 59, 59);

  const categorias = await prisma.category.findMany({
    where: { OR: [{ coupleId: null }, ...(coupleId ? [{ coupleId }] : [])] },
    select: { id: true, nome: true, icone: true },
    orderBy: { nome: "asc" },
  });

  const budgets = await prisma.budget.findMany({
    where: { userId: user.id, mesReferencia: mesRef },
    select: { id: true, categoriaId: true, limiteMensal: true },
  });
  const budgetMap = new Map(budgets.map((b) => [b.categoriaId, b]));

  const gastosPorCat = await prisma.transaction.groupBy({
    by: ["categoriaId"],
    where: {
      OR: [
        { userId: user.id },
        ...(coupleId ? [{ coupleId, escopo: "COMPARTILHADA" as const }] : []),
      ],
      tipo: "DESPESA",
      data: { gte: mesStart, lte: mesEnd },
      deletedAt: null,
      categoriaId: { not: null },
    },
    _sum: { valor: true },
  });
  const gastosMap = new Map(
    gastosPorCat.map((g) => [g.categoriaId!, Number(g._sum.valor ?? 0)])
  );

  const result = categorias.map((cat) => {
    const budget = budgetMap.get(cat.id);
    const gasto = gastosMap.get(cat.id) ?? 0;
    const limite = budget ? Number(budget.limiteMensal) : null;
    const { status, percentual } = computeStatus(gasto, limite);
    return {
      categoria: { id: cat.id, nome: cat.nome, icone: cat.icone },
      budgetId: budget?.id ?? null,
      limite,
      gasto_atual: gasto,
      percentual,
      status,
      grupo: getCategoriaGrupo(cat.nome),
    };
  });

  result.sort((a, b) => {
    const diff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (diff !== 0) return diff;
    return (b.percentual ?? -1) - (a.percentual ?? -1);
  });

  const mesStr = `${year}-${String(month).padStart(2, "0")}`;
  return NextResponse.json({ budgets: result, mes: mesStr });
}

// ─── PUT /api/budgets ─────────────────────────────────────────────────────────

const UpsertBudgetSchema = z.array(
  z.object({
    categoriaId: z.string().uuid(),
    limiteMensal: z.number().nonnegative(),
    mesReferencia: z.string().regex(/^\d{4}-\d{2}$/),
  })
);

export async function PUT(req: NextRequest) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { user, coupleId } = auth;
  const body = await req.json();

  const parsed = UpsertBudgetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const ops = parsed.data.map(({ categoriaId, limiteMensal, mesReferencia }) => {
    const { year, month } = parseMesStr(mesReferencia);
    const mesRef = mesReferenciaDate(year, month);
    return prisma.budget.upsert({
      where: {
        userId_categoriaId_mesReferencia: {
          userId: user.id,
          categoriaId,
          mesReferencia: mesRef,
        },
      },
      update: { limiteMensal, coupleId: coupleId ?? null },
      create: {
        userId: user.id,
        coupleId: coupleId ?? null,
        categoriaId,
        limiteMensal,
        mesReferencia: mesRef,
      },
    });
  });

  const results = await prisma.$transaction(ops);
  return NextResponse.json({ updated: results.length });
}
