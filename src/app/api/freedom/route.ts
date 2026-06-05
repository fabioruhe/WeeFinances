import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";

function toNum(v: unknown): number {
  if (v === null || v === undefined) return 0;
  return typeof v === "object" && "toNumber" in (v as object)
    ? (v as { toNumber(): number }).toNumber()
    : Number(v);
}

// ─── GET /api/freedom ────────────────────────────────────────────────────────

export async function GET() {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { user, coupleId, isCouple } = auth;
  const ownerWhere = isCouple && coupleId
    ? { coupleId }
    : { userId: user.id, coupleId: null };

  // Fixed expenses ordered by priority
  const expenses = await prisma.fixedExpense.findMany({
    where: { ...ownerWhere, ativo: true },
    orderBy: { prioridade: "asc" },
    select: { id: true, nome: true, valorMedio: true },
  });

  // Average monthly dividends (last 3 months)
  const now = new Date();
  const start3m = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const recentDividends = await prisma.dividendEntry.findMany({
    where: {
      ...ownerWhere,
      mesReferencia: { gte: start3m, lt: endMonth },
    },
    select: { valor: true, mesReferencia: true },
  });

  // Group by month and average
  const monthTotals = new Map<string, number>();
  for (const d of recentDividends) {
    const key = d.mesReferencia.toISOString().slice(0, 7);
    monthTotals.set(key, (monthTotals.get(key) ?? 0) + toNum(d.valor));
  }
  const monthValues = [...monthTotals.values()];
  const totalProventos = monthValues.length > 0
    ? monthValues.reduce((s, v) => s + v, 0) / monthValues.length
    : 0;

  // Distribute income across expenses by priority
  let remaining = totalProventos;
  const totalDespesasFixas = expenses.reduce((s, e) => s + toNum(e.valorMedio), 0);

  const contas = expenses.map((e) => {
    const valor = toNum(e.valorMedio);
    const coberto = Math.min(remaining, valor);
    remaining = Math.max(0, remaining - valor);
    const percentual = valor > 0 ? (coberto / valor) * 100 : 0;
    let status: "COBERTA" | "PARCIAL" | "PENDENTE";
    if (percentual >= 100) status = "COBERTA";
    else if (percentual > 0) status = "PARCIAL";
    else status = "PENDENTE";

    return {
      id: e.id,
      nome: e.nome,
      valorMedio: valor,
      coberto,
      percentual,
      status,
    };
  });

  const contasCobertas = contas.filter((c) => c.status === "COBERTA").length;
  const percentualGeral = totalDespesasFixas > 0
    ? Math.min(100, (totalProventos / totalDespesasFixas) * 100)
    : 0;

  // Next achievement: first non-covered expense
  const proximaConta = contas.find((c) => c.status !== "COBERTA");
  const proximaConquista = proximaConta
    ? { nome: proximaConta.nome, falta: proximaConta.valorMedio - proximaConta.coberto }
    : null;

  return NextResponse.json({
    percentualGeral,
    totalDespesasFixas,
    totalProventos,
    contas,
    contasCobertas,
    contasTotal: contas.length,
    proximaConquista,
  });
}
