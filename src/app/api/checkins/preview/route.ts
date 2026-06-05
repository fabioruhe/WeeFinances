import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";
import { parseMesStr, mesReferenciaDate } from "@/lib/budget-utils";

// ─── GET /api/checkins/preview?mes=2026-06 ──────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { user, coupleId, isCouple } = auth;
  const { year, month } = parseMesStr(req.nextUrl.searchParams.get("mes"));

  const mesStart = new Date(year, month - 1, 1);
  const mesEnd = new Date(year, month, 0, 23, 59, 59);
  const mesRef = mesReferenciaDate(year, month);
  const mesStr = `${year}-${String(month).padStart(2, "0")}`;

  const ownerWhere = isCouple && coupleId
    ? { coupleId }
    : { userId: user.id, coupleId: null };

  const txWhere = {
    OR: [
      { userId: user.id },
      ...(isCouple && coupleId
        ? [{ coupleId, escopo: "COMPARTILHADA" as const }]
        : []),
    ],
    data: { gte: mesStart, lte: mesEnd },
    deletedAt: null,
  };

  // ── Check if already did check-in this month ──
  const existingCheckin = await prisma.checkIn.findFirst({
    where: {
      ...(isCouple && coupleId
        ? { coupleId }
        : { userId: user.id }),
      data: mesRef,
    },
  });

  // ── Step 1: Receitas, Despesas, Saldo ──
  const [receitasAgg, despesasAgg] = await Promise.all([
    prisma.transaction.aggregate({
      where: { ...txWhere, tipo: "RECEITA" },
      _sum: { valor: true },
    }),
    prisma.transaction.aggregate({
      where: { ...txWhere, tipo: "DESPESA" },
      _sum: { valor: true },
    }),
  ]);

  const receitas = Number(receitasAgg._sum.valor ?? 0);
  const despesas = Number(despesasAgg._sum.valor ?? 0);
  const saldo = receitas - despesas;

  // ── Step 1: Categorias vs orçamento ──
  const budgets = await prisma.budget.findMany({
    where: { userId: user.id, mesReferencia: mesRef },
    select: { id: true, categoriaId: true, limiteMensal: true },
  });
  const budgetMap = new Map(
    budgets.map((b) => [b.categoriaId, { id: b.id, limite: Number(b.limiteMensal) }]),
  );

  const gastosPorCat = await prisma.transaction.groupBy({
    by: ["categoriaId"],
    where: { ...txWhere, tipo: "DESPESA", categoriaId: { not: null } },
    _sum: { valor: true },
  });

  const catIds = new Set([
    ...budgetMap.keys(),
    ...gastosPorCat.map((g) => g.categoriaId!),
  ]);

  const categorias = await prisma.category.findMany({
    where: { id: { in: [...catIds] } },
    select: { id: true, nome: true, icone: true },
  });
  const catMap = new Map(categorias.map((c) => [c.id, c]));

  const gastosMap = new Map(
    gastosPorCat.map((g) => [g.categoriaId!, Number(g._sum.valor ?? 0)]),
  );

  type CatEstourada = {
    categoriaId: string;
    nome: string;
    icone: string | null;
    budgetId: string | null;
    limite: number;
    gasto: number;
    excesso: number;
    percentual: number;
  };
  type CatAbaixo = {
    categoriaId: string;
    nome: string;
    icone: string | null;
    limite: number;
    gasto: number;
    percentual: number;
  };

  const categoriasEstouradas: CatEstourada[] = [];
  const categoriasAbaixo: CatAbaixo[] = [];
  let totalComLimite = 0;
  let dentroDo = 0;

  for (const [catId, budget] of budgetMap) {
    const cat = catMap.get(catId);
    if (!cat || budget.limite <= 0) continue;
    totalComLimite++;
    const gasto = gastosMap.get(catId) ?? 0;
    const pct = (gasto / budget.limite) * 100;

    if (gasto > budget.limite) {
      categoriasEstouradas.push({
        categoriaId: catId,
        nome: cat.nome,
        icone: cat.icone,
        budgetId: budget.id,
        limite: budget.limite,
        gasto,
        excesso: gasto - budget.limite,
        percentual: pct,
      });
    } else if (pct < 80) {
      categoriasAbaixo.push({
        categoriaId: catId,
        nome: cat.nome,
        icone: cat.icone,
        limite: budget.limite,
        gasto,
        percentual: pct,
      });
    }

    if (gasto <= budget.limite) dentroDo++;
  }

  // Sort: most overbudget first
  categoriasEstouradas.sort((a, b) => b.excesso - a.excesso);
  // Top 3
  const topEstouradas = categoriasEstouradas.slice(0, 3);

  // ── Step 2: Celebração — Metas que avançaram ──
  const goals = await prisma.goal.findMany({
    where: { ...ownerWhere, status: "ATIVA" },
    include: {
      contributions: {
        where: { createdAt: { gte: mesStart, lte: mesEnd } },
        select: { valor: true },
      },
    },
  });

  const metasAvancaram = goals
    .filter((g) => g.contributions.length > 0)
    .map((g) => {
      const contribMes = g.contributions.reduce(
        (sum, c) => sum + Number(c.valor),
        0,
      );
      const valorAlvo = Number(g.valorAlvo);
      const valorAtual = Number(g.valorAtual);
      return {
        id: g.id,
        nome: g.nome,
        tipo: g.tipo,
        valorAlvo,
        valorAtual,
        progresso: valorAlvo > 0 ? Math.min((valorAtual / valorAlvo) * 100, 100) : 0,
        contribuicaoMes: contribMes,
        projecaoConclusao: null as string | null,
      };
    });

  // ── Step 2: Dívidas com pagamento no mês ──
  const debts = await prisma.debt.findMany({
    where: ownerWhere,
    include: {
      payments: {
        where: { data: { gte: mesStart, lte: mesEnd } },
        select: { valor: true },
      },
    },
  });

  const dividasPagas = debts
    .filter((d) => d.payments.length > 0)
    .map((d) => ({
      id: d.id,
      nome: d.nome,
      valorPago: d.payments.reduce((s, p) => s + Number(p.valor), 0),
      valorRestante: Number(d.valorRestante),
    }));

  const valorEconomizado = saldo > 0 ? saldo : 0;

  // ── Step 4: Metas ativas ──
  const metasAtivas = goals.map((g) => {
    const valorAlvo = Number(g.valorAlvo);
    const valorAtual = Number(g.valorAtual);
    const contribMensal =
      Number(g.contribuicaoA ?? 0) + Number(g.contribuicaoB ?? 0);
    let projecao: string | null = null;
    if (contribMensal > 0 && valorAtual < valorAlvo) {
      const meses = Math.ceil((valorAlvo - valorAtual) / contribMensal);
      const d = new Date();
      d.setMonth(d.getMonth() + meses);
      projecao = d.toISOString().split("T")[0];
    }
    return {
      id: g.id,
      nome: g.nome,
      tipo: g.tipo,
      valorAlvo,
      valorAtual,
      progresso: valorAlvo > 0 ? Math.min((valorAtual / valorAlvo) * 100, 100) : 0,
      contribuicaoMes: g.contributions.reduce(
        (s, c) => s + Number(c.valor),
        0,
      ),
      projecaoConclusao: projecao,
    };
  });

  return NextResponse.json({
    isCouple,
    userId: user.id,
    jaFezCheckin: !!existingCheckin,
    receitas,
    despesas,
    saldo,
    categoriasEstouradas: topEstouradas,
    categoriasAbaixo,
    totalCategorias: totalComLimite,
    categoriasDentro: dentroDo,
    metasAvancaram,
    dividasPagas,
    valorEconomizado,
    metasAtivas,
    mes: mesStr,
  });
}
