import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";
import { parseMesStr } from "@/lib/budget-utils";

// ─── Helpers ────────────────────────────────────────────────────────────────

function startOfMonth(y: number, m: number) {
  return new Date(y, m - 1, 1);
}
function endOfMonth(y: number, m: number) {
  return new Date(y, m, 0, 23, 59, 59);
}

type TxWhere = {
  OR: Array<Record<string, unknown>>;
  data: { gte: Date; lte: Date };
  deletedAt: null;
};

function buildTxWhere(
  userId: string,
  coupleId: string | null,
  isCouple: boolean,
  start: Date,
  end: Date,
): TxWhere {
  return {
    OR: [
      { userId },
      ...(isCouple && coupleId
        ? [{ coupleId, escopo: "COMPARTILHADA" as const }]
        : []),
    ],
    data: { gte: start, lte: end },
    deletedAt: null,
  };
}

// ─── GET /api/reports?tipo=mensal|evolucao|casal&mes=YYYY-MM ────────────────

export async function GET(req: NextRequest) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { user, coupleId, isCouple } = auth;
  const tipo = req.nextUrl.searchParams.get("tipo") ?? "mensal";

  if (tipo === "mensal") return handleMensal(req, user, coupleId, isCouple);
  if (tipo === "evolucao") return handleEvolucao(user, coupleId, isCouple);
  if (tipo === "casal") return handleCasal(req, user, coupleId, isCouple);

  return NextResponse.json({ error: "tipo inválido" }, { status: 400 });
}

// ─── Mensal ──────────────────────────────────────────────────────────────────

async function handleMensal(
  req: NextRequest,
  user: { id: string },
  coupleId: string | null,
  isCouple: boolean,
) {
  const { year, month } = parseMesStr(req.nextUrl.searchParams.get("mes"));
  const mesStart = startOfMonth(year, month);
  const mesEnd = endOfMonth(year, month);
  const txWhere = buildTxWhere(user.id, coupleId, isCouple, mesStart, mesEnd);

  // Receitas e despesas
  const [recAgg, despAgg] = await Promise.all([
    prisma.transaction.aggregate({ where: { ...txWhere, tipo: "RECEITA" }, _sum: { valor: true } }),
    prisma.transaction.aggregate({ where: { ...txWhere, tipo: "DESPESA" }, _sum: { valor: true } }),
  ]);
  const receitas = Number(recAgg._sum.valor ?? 0);
  const despesas = Number(despAgg._sum.valor ?? 0);

  // Gastos por categoria
  const gastosPorCat = await prisma.transaction.groupBy({
    by: ["categoriaId"],
    where: { ...txWhere, tipo: "DESPESA", categoriaId: { not: null } },
    _sum: { valor: true },
  });

  const catIds = gastosPorCat.map((g) => g.categoriaId!);
  const cats = await prisma.category.findMany({
    where: { id: { in: catIds } },
    select: { id: true, nome: true, icone: true },
  });
  const catMap = new Map(cats.map((c) => [c.id, c]));

  const gastosCat = gastosPorCat
    .map((g) => {
      const cat = catMap.get(g.categoriaId!);
      const valor = Number(g._sum.valor ?? 0);
      return {
        nome: cat?.nome ?? "Outros",
        icone: cat?.icone ?? null,
        valor,
        percentual: despesas > 0 ? (valor / despesas) * 100 : 0,
      };
    })
    .sort((a, b) => b.valor - a.valor);

  // Top 5 maiores gastos
  const topTx = await prisma.transaction.findMany({
    where: { ...txWhere, tipo: "DESPESA" },
    orderBy: { valor: "desc" },
    take: 5,
    select: {
      id: true,
      descricao: true,
      valor: true,
      data: true,
      categoria: { select: { nome: true } },
    },
  });
  const topGastos = topTx.map((t) => ({
    id: t.id,
    descricao: t.descricao ?? "",
    valor: Number(t.valor),
    data: t.data.toISOString().split("T")[0],
    categoria: t.categoria?.nome ?? null,
  }));

  // Comparativo mês anterior
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevStart = startOfMonth(prevYear, prevMonth);
  const prevEnd = endOfMonth(prevYear, prevMonth);
  const prevWhere = buildTxWhere(user.id, coupleId, isCouple, prevStart, prevEnd);

  const prevAgg = await prisma.transaction.aggregate({
    where: { ...prevWhere, tipo: "DESPESA" },
    _sum: { valor: true },
  });
  const despesasAnterior = Number(prevAgg._sum.valor ?? 0);

  const comparativo = despesasAnterior > 0
    ? {
        mesAnterior: `${prevYear}-${String(prevMonth).padStart(2, "0")}`,
        despesasAnterior,
        variacao: ((despesas - despesasAnterior) / despesasAnterior) * 100,
      }
    : null;

  // Insights (max 3)
  const insights: Array<{ tipo: "info" | "success" | "warning"; texto: string }> = [];

  const saldo = receitas - despesas;
  if (saldo <= 0 && insights.length < 3) {
    insights.push({
      tipo: "warning",
      texto: isCouple
        ? "Este mês não sobrou para poupança. Que tal revisarem juntos as categorias com maior gasto?"
        : "Este mês não sobrou para poupança. Que tal revisar as categorias com maior gasto?",
    });
  }

  if (comparativo && comparativo.variacao > 20 && insights.length < 3) {
    insights.push({
      tipo: "info",
      texto: `Os gastos aumentaram ${Math.round(comparativo.variacao)}% em relação ao mês anterior. Vale conferir o que mudou.`,
    });
  }

  if (comparativo && comparativo.variacao < -10 && insights.length < 3) {
    insights.push({
      tipo: "success",
      texto: `Os gastos diminuíram ${Math.abs(Math.round(comparativo.variacao))}% em relação ao mês anterior. Ótimo progresso!`,
    });
  }

  // Check goals ahead of schedule
  const ownerWhere = isCouple && coupleId
    ? { coupleId }
    : { userId: user.id, coupleId: null };

  if (insights.length < 3) {
    const goals = await prisma.goal.findMany({
      where: { ...ownerWhere, status: "ATIVA", prazo: { not: null } },
      select: { nome: true, valorAlvo: true, valorAtual: true, prazo: true, contribuicaoA: true, contribuicaoB: true },
    });
    for (const g of goals) {
      if (insights.length >= 3) break;
      const alvo = Number(g.valorAlvo);
      const atual = Number(g.valorAtual);
      const contribMensal = Number(g.contribuicaoA ?? 0) + Number(g.contribuicaoB ?? 0);
      if (contribMensal > 0 && g.prazo) {
        const mesesRestantes = Math.max(
          0,
          (g.prazo.getFullYear() - new Date().getFullYear()) * 12 +
            (g.prazo.getMonth() - new Date().getMonth()),
        );
        const mesesNecessarios = alvo > atual ? Math.ceil((alvo - atual) / contribMensal) : 0;
        if (mesesNecessarios > 0 && mesesRestantes > mesesNecessarios + 2) {
          insights.push({
            tipo: "success",
            texto: `A meta "${g.nome}" está acelerada! Pode ser atingida ${mesesRestantes - mesesNecessarios} meses antes do prazo.`,
          });
        }
      }
    }
  }

  const mesStr = `${year}-${String(month).padStart(2, "0")}`;

  return NextResponse.json({
    mes: mesStr,
    receitas,
    despesas,
    saldo,
    gastosPorCategoria: gastosCat,
    topGastos,
    comparativo,
    insights,
    isCouple,
  });
}

// ─── Evolução ────────────────────────────────────────────────────────────────

async function handleEvolucao(
  user: { id: string },
  coupleId: string | null,
  isCouple: boolean,
) {
  const now = new Date();
  const evolucao: Array<{
    mes: string;
    receitas: number;
    despesas: number;
    poupanca: number;
  }> = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const start = startOfMonth(y, m);
    const end = endOfMonth(y, m);
    const txWhere = buildTxWhere(user.id, coupleId, isCouple, start, end);

    const [recAgg, despAgg] = await Promise.all([
      prisma.transaction.aggregate({ where: { ...txWhere, tipo: "RECEITA" }, _sum: { valor: true } }),
      prisma.transaction.aggregate({ where: { ...txWhere, tipo: "DESPESA" }, _sum: { valor: true } }),
    ]);

    const receitas = Number(recAgg._sum.valor ?? 0);
    const despesas = Number(despAgg._sum.valor ?? 0);

    evolucao.push({
      mes: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
      receitas,
      despesas,
      poupanca: receitas - despesas,
    });
  }

  return NextResponse.json({ evolucao, isCouple });
}

// ─── Casal ───────────────────────────────────────────────────────────────────

async function handleCasal(
  req: NextRequest,
  user: { id: string },
  coupleId: string | null,
  isCouple: boolean,
) {
  if (!isCouple || !coupleId) {
    return NextResponse.json({ error: "Disponível apenas para casais." }, { status: 400 });
  }

  const { year, month } = parseMesStr(req.nextUrl.searchParams.get("mes"));
  const mesStart = startOfMonth(year, month);
  const mesEnd = endOfMonth(year, month);

  const couple = await prisma.couple.findUnique({
    where: { id: coupleId },
    select: {
      userAId: true,
      userBId: true,
      userA: { select: { nome: true } },
      userB: { select: { nome: true } },
    },
  });

  if (!couple || !couple.userBId) {
    return NextResponse.json({ error: "Casal incompleto." }, { status: 400 });
  }

  const userIds = [couple.userAId, couple.userBId];
  const parceiros = [];

  for (const uid of userIds) {
    const nome =
      uid === couple.userAId
        ? couple.userA.nome
        : couple.userB?.nome;

    const [recAgg, despAgg, despCompAgg] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId: uid, tipo: "RECEITA", data: { gte: mesStart, lte: mesEnd }, deletedAt: null },
        _sum: { valor: true },
      }),
      prisma.transaction.aggregate({
        where: { userId: uid, tipo: "DESPESA", data: { gte: mesStart, lte: mesEnd }, deletedAt: null },
        _sum: { valor: true },
      }),
      prisma.transaction.aggregate({
        where: {
          userId: uid,
          tipo: "DESPESA",
          escopo: "COMPARTILHADA",
          data: { gte: mesStart, lte: mesEnd },
          deletedAt: null,
        },
        _sum: { valor: true },
      }),
    ]);

    parceiros.push({
      userId: uid,
      nome: nome ?? "Parceiro",
      receitas: Number(recAgg._sum.valor ?? 0),
      despesas: Number(despAgg._sum.valor ?? 0),
      despesasCompartilhadas: Number(despCompAgg._sum.valor ?? 0),
    });
  }

  const saldoEntre =
    parceiros[0].despesasCompartilhadas - parceiros[1].despesasCompartilhadas;

  const mesStr = `${year}-${String(month).padStart(2, "0")}`;

  return NextResponse.json({
    parceiros,
    saldoEntre,
    nomeA: parceiros[0].nome,
    nomeB: parceiros[1].nome,
    mes: mesStr,
  });
}
