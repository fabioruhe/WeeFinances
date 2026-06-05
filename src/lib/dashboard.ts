import { prisma } from "@/lib/prisma";
import { isCoupleById } from "@/lib/session";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DashboardScope = "meu" | "nosso" | "dele";

export type DashboardData = {
  mode: "solo" | "couple";
  scope: DashboardScope;
  partnerName: string | null;
  saldo: {
    receitas: number;
    despesas: number;
    saldo: number;
  };
  score: {
    total: number;
    breakdown: {
      reservaEmergencia: number;
      taxaPoupanca: number;
      endividamento: number;
      alinhamentoMetas: number;
      checkIns: number;
      progressoMetas: number;
      diversificacao: number;
    };
  };
  proximasContas: Array<{
    id: string;
    nome: string;
    valor: number;
    diasAteVencimento: number;
  }>;
  metas: Array<{
    id: string;
    nome: string;
    tipo: string;
    valorAtual: number;
    valorAlvo: number;
    percentual: number;
  }>;
  gastosPorCategoria: Array<{
    nome: string;
    icone: string | null;
    valor: number;
    percentual: number;
  }>;
  evolucaoMensal: Array<{
    mes: string;
    receitas: number;
    despesas: number;
    poupanca: number;
  }>;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
}

function addMonths(date: Date, n: number) {
  return new Date(date.getFullYear(), date.getMonth() + n, 1);
}

function monthLabel(date: Date) {
  return date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

function toNum(val: unknown): number {
  if (val === null || val === undefined) return 0;
  return typeof val === "object" && "toNumber" in (val as object)
    ? (val as { toNumber(): number }).toNumber()
    : Number(val);
}

// ─── Transaction filter by scope ─────────────────────────────────────────────

function buildTransactionWhere(
  scope: DashboardScope,
  mode: "solo" | "couple",
  userId: string,
  coupleId: string | null,
  partnerId: string | null,
  dateStart: Date,
  dateEnd: Date,
  tipo?: "RECEITA" | "DESPESA"
) {
  const base = {
    data: { gte: dateStart, lte: dateEnd },
    ...(tipo ? { tipo } : {}),
  };

  if (mode === "solo") {
    return { ...base, userId };
  }

  switch (scope) {
    case "meu":
      return { ...base, userId };
    case "nosso":
      return { ...base, coupleId, escopo: "COMPARTILHADA" as const };
    case "dele":
      return {
        ...base,
        userId: partnerId ?? "__none__",
        escopo: "COMPARTILHADA" as const,
      };
  }
}

// ─── Main fetch function ─────────────────────────────────────────────────────

export async function fetchDashboardData(
  userId: string,
  scope: DashboardScope
): Promise<DashboardData> {
  // Load user + couple info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      coupleId: true,
      couple: {
        select: {
          status: true,
          userAId: true,
          userBId: true,
          userA: { select: { id: true, nome: true } },
          userB: { select: { id: true, nome: true } },
        },
      },
    },
  });

  const coupleId = user?.coupleId ?? null;
  const isActiveCouple = user?.couple?.status === "ATIVO" && isCoupleById(coupleId);
  const mode: "solo" | "couple" = isActiveCouple ? "couple" : "solo";

  let partnerId: string | null = null;
  let partnerName: string | null = null;
  if (isActiveCouple && user?.couple) {
    const c = user.couple;
    if (c.userAId === userId) {
      partnerId = c.userBId ?? null;
      partnerName = c.userB?.nome ?? null;
    } else {
      partnerId = c.userAId;
      partnerName = c.userA?.nome ?? null;
    }
  }

  const now = new Date();
  const mesStart = startOfMonth(now);
  const mesEnd = endOfMonth(now);

  // ── Card 1: Saldo ───────────────────────────────────────────────────────────
  const [txReceitas, txDespesas] = await Promise.all([
    prisma.transaction.aggregate({
      where: buildTransactionWhere(scope, mode, userId, coupleId, partnerId, mesStart, mesEnd, "RECEITA"),
      _sum: { valor: true },
    }),
    prisma.transaction.aggregate({
      where: buildTransactionWhere(scope, mode, userId, coupleId, partnerId, mesStart, mesEnd, "DESPESA"),
      _sum: { valor: true },
    }),
  ]);

  const receitas = toNum(txReceitas._sum.valor);
  const despesas = toNum(txDespesas._sum.valor);
  const saldo = receitas - despesas;

  // ── Card 2: Score ──────────────────────────────────────────────────────────
  const [
    emergencyGoal,
    allDebts,
    monthIncomes,
    allMonthExpenses,
    allGoals,
    goalsWithContrib,
    checkInThisMonth,
    userAssets,
  ] = await Promise.all([
    prisma.goal.findFirst({
      where: { userId, status: "ATIVA", tipo: "EMERGENCIA" },
      select: { valorAtual: true },
    }),
    prisma.debt.findMany({
      where: { userId },
      select: { valorRestante: true },
    }),
    prisma.income.aggregate({
      where: { userId, mesReferencia: { gte: mesStart, lte: mesEnd } },
      _sum: { valor: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, tipo: "DESPESA", data: { gte: mesStart, lte: mesEnd } },
      _sum: { valor: true },
    }),
    prisma.goal.count({ where: { userId, status: "ATIVA" } }),
    prisma.goal.count({
      where: {
        userId,
        status: "ATIVA",
        contributions: {
          some: { data: { gte: mesStart, lte: mesEnd } },
        },
      },
    }),
    prisma.checkIn.findFirst({
      where: mode === "couple" ? { coupleId } : { userId },
      orderBy: { data: "desc" },
      select: { data: true },
    }),
    prisma.asset.findMany({
      where: { userId, ativo: true },
      select: { tipo: true },
    }),
  ]);

  const rendaMensal = toNum(monthIncomes._sum.valor);
  const despesasMensais = toNum(allMonthExpenses._sum.valor);
  const totalDividas = allDebts.reduce((s, d) => s + toNum(d.valorRestante), 0);
  const reservaEmergAtual = toNum(emergencyGoal?.valorAtual ?? 0);
  const reservaAlvo = despesasMensais * 6;
  const poupancaMensal = rendaMensal - despesasMensais;
  const tiposAtivos = new Set(userAssets.map((a) => a.tipo)).size;
  const checkInFeitoMes =
    checkInThisMonth && checkInThisMonth.data >= mesStart && checkInThisMonth.data <= mesEnd;

  let breakdown = {
    reservaEmergencia: 0,
    taxaPoupanca: 0,
    endividamento: 0,
    alinhamentoMetas: 0,
    checkIns: 0,
    progressoMetas: 0,
    diversificacao: 0,
  };

  if (mode === "couple") {
    breakdown.reservaEmergencia =
      reservaAlvo > 0 ? Math.min((reservaEmergAtual / reservaAlvo) * 25, 25) : 0;
    const taxaPoupanca = rendaMensal > 0 ? (poupancaMensal / rendaMensal) * 100 : 0;
    breakdown.taxaPoupanca =
      taxaPoupanca >= 20 ? 20 : Math.max((taxaPoupanca / 20) * 20, 0);
    const ratioEndividamento = rendaMensal > 0 ? (totalDividas / rendaMensal) * 100 : 100;
    breakdown.endividamento =
      ratioEndividamento < 30
        ? 20
        : Math.max(20 - ((ratioEndividamento - 30) / 70) * 20, 0);
    breakdown.alinhamentoMetas =
      allGoals > 0 ? (goalsWithContrib / allGoals) * 15 : 0;
    breakdown.checkIns = checkInFeitoMes ? 10 : 0;
    breakdown.diversificacao = tiposAtivos > 1 ? 10 : 0;
  } else {
    breakdown.reservaEmergencia =
      reservaAlvo > 0 ? Math.min((reservaEmergAtual / reservaAlvo) * 30, 30) : 0;
    const taxaPoupanca = rendaMensal > 0 ? (poupancaMensal / rendaMensal) * 100 : 0;
    breakdown.taxaPoupanca =
      taxaPoupanca >= 20 ? 25 : Math.max((taxaPoupanca / 20) * 25, 0);
    const ratioEndividamento = rendaMensal > 0 ? (totalDividas / rendaMensal) * 100 : 100;
    breakdown.endividamento =
      ratioEndividamento < 30
        ? 25
        : Math.max(25 - ((ratioEndividamento - 30) / 70) * 25, 0);
    breakdown.progressoMetas =
      allGoals > 0 ? (goalsWithContrib / allGoals) * 10 : 0;
    breakdown.diversificacao = tiposAtivos > 1 ? 10 : 0;
  }

  const scoreTotal = Math.round(
    breakdown.reservaEmergencia +
      breakdown.taxaPoupanca +
      breakdown.endividamento +
      breakdown.alinhamentoMetas +
      breakdown.checkIns +
      breakdown.progressoMetas +
      breakdown.diversificacao
  );

  // ── Card 3: Proximas Contas (5 dias) ────────────────────────────────────────
  const today = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const proximasContas = await prisma.debt.findMany({
    where: {
      ...(mode === "couple" && coupleId ? { coupleId } : { userId }),
      valorRestante: { gt: 0 },
      vencimentoDia: { not: null },
    },
    select: { id: true, nome: true, valorRestante: true, vencimentoDia: true },
    orderBy: { valorRestante: "desc" },
  });

  const contasVencendo = proximasContas
    .map((d) => {
      const dia = d.vencimentoDia!;
      let diff = dia - today;
      if (diff < 0) diff += daysInMonth;
      return {
        id: d.id,
        nome: d.nome,
        valor: toNum(d.valorRestante),
        diasAteVencimento: diff,
      };
    })
    .filter((c) => c.diasAteVencimento <= 5)
    .sort((a, b) => a.diasAteVencimento - b.diasAteVencimento);

  // ── Card 4: Metas Ativas (top 3) ────────────────────────────────────────────
  const goalsRaw = await prisma.goal.findMany({
    where: {
      ...(mode === "couple" && coupleId ? { coupleId } : { userId }),
      status: "ATIVA",
    },
    orderBy: { valorAtual: "desc" },
    take: 3,
    select: { id: true, nome: true, tipo: true, valorAtual: true, valorAlvo: true },
  });

  const metas = goalsRaw.map((g) => {
    const atual = toNum(g.valorAtual);
    const alvo = toNum(g.valorAlvo);
    return {
      id: g.id,
      nome: g.nome,
      tipo: g.tipo,
      valorAtual: atual,
      valorAlvo: alvo,
      percentual: alvo > 0 ? Math.min((atual / alvo) * 100, 100) : 0,
    };
  });

  // ── Card 5: Gastos por Categoria ────────────────────────────────────────────
  const txPorCat = await prisma.transaction.groupBy({
    by: ["categoriaId"],
    where: buildTransactionWhere(scope, mode, userId, coupleId, partnerId, mesStart, mesEnd, "DESPESA"),
    _sum: { valor: true },
    orderBy: { _sum: { valor: "desc" } },
    take: 5,
  });

  const catIds = txPorCat.map((r) => r.categoriaId).filter(Boolean) as string[];
  const cats = await prisma.category.findMany({
    where: { id: { in: catIds } },
    select: { id: true, nome: true, icone: true },
  });
  const catMap = new Map(cats.map((c) => [c.id, c]));
  const totalGastos = txPorCat.reduce((s, r) => s + toNum(r._sum.valor), 0);

  const gastosPorCategoria = txPorCat.map((r) => {
    const cat = r.categoriaId ? catMap.get(r.categoriaId) : null;
    const valor = toNum(r._sum.valor);
    return {
      nome: cat?.nome ?? "Sem categoria",
      icone: cat?.icone ?? null,
      valor,
      percentual: totalGastos > 0 ? Math.round((valor / totalGastos) * 100) : 0,
    };
  });

  // ── Card 6: Evolucao Mensal (ultimos 6 meses) ───────────────────────────────
  const evolucaoMensal = await Promise.all(
    Array.from({ length: 6 }, (_, i) => {
      const d = addMonths(now, -(5 - i));
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const label = monthLabel(d);

      return Promise.all([
        prisma.transaction.aggregate({
          where: buildTransactionWhere(scope, mode, userId, coupleId, partnerId, start, end, "RECEITA"),
          _sum: { valor: true },
        }),
        prisma.transaction.aggregate({
          where: buildTransactionWhere(scope, mode, userId, coupleId, partnerId, start, end, "DESPESA"),
          _sum: { valor: true },
        }),
      ]).then(([rec, des]) => {
        const r = toNum(rec._sum.valor);
        const d2 = toNum(des._sum.valor);
        return { mes: label, receitas: r, despesas: d2, poupanca: Math.max(r - d2, 0) };
      });
    })
  );

  return {
    mode,
    scope,
    partnerName,
    saldo: { receitas, despesas, saldo },
    score: { total: scoreTotal, breakdown },
    proximasContas: contasVencendo,
    metas,
    gastosPorCategoria,
    evolucaoMensal,
  };
}
