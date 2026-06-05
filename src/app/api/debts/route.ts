import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";

// ─── Schema ───────────────────────────────────────────────────────────────────

const CreateDebtSchema = z.object({
  nome: z.string().min(2).max(100),
  valor_total: z.number().positive(),
  valor_restante: z.number().min(0),
  parcelas_total: z.number().int().positive().optional().nullable(),
  parcelas_pagas: z.number().int().min(0).default(0),
  taxa_juros_mensal: z.number().min(0).max(100).optional().nullable(),
  dia_vencimento: z.number().int().min(1).max(31).optional().nullable(),
  escopo: z.enum(["INDIVIDUAL", "COMPARTILHADA"]).default("INDIVIDUAL"),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toNum(v: unknown) {
  return typeof v === "object" && v !== null && "toNumber" in (v as object)
    ? (v as { toNumber(): number }).toNumber()
    : Number(v ?? 0);
}

function calcParcelaMensal(
  valorRestante: number,
  parcelasTotal: number | null,
  parcelasPagas: number,
): number {
  if (parcelasTotal && parcelasTotal > parcelasPagas) {
    return valorRestante / (parcelasTotal - parcelasPagas);
  }
  return valorRestante * 0.05; // 5% do saldo como mínimo padrão
}

function calcAlertaVencimento(diaVencimento: number | null): string | null {
  if (!diaVencimento) return null;
  const hoje = new Date();
  const diaHoje = hoje.getDate();
  const diasMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();

  let diff = diaVencimento - diaHoje;
  if (diff < 0) diff += diasMes;

  if (diff === 0) return "HOJE";
  if (diff === 1) return "AMANHA";
  if (diff <= 3) return "EM_BREVE";
  return null;
}

function mapDebt(d: {
  id: string;
  nome: string;
  valorTotal: unknown;
  valorRestante: unknown;
  parcelasTotal: number | null;
  parcelasPagas: number;
  taxaJuros: unknown;
  vencimentoDia: number | null;
  estrategia: string;
  escopo: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  const valorTotal = toNum(d.valorTotal);
  const valorRestante = toNum(d.valorRestante);
  const taxaJuros = toNum(d.taxaJuros);
  const parcelaMensal = calcParcelaMensal(valorRestante, d.parcelasTotal, d.parcelasPagas);
  const progresso =
    valorTotal > 0 ? Math.min(((valorTotal - valorRestante) / valorTotal) * 100, 100) : 100;

  return {
    id: d.id,
    nome: d.nome,
    valorTotal,
    valorRestante,
    parcelasTotal: d.parcelasTotal,
    parcelasPagas: d.parcelasPagas,
    parcelasRestantes: d.parcelasTotal
      ? Math.max(d.parcelasTotal - d.parcelasPagas, 0)
      : null,
    taxaJuros,
    parcelaMensal,
    vencimentoDia: d.vencimentoDia,
    estrategia: d.estrategia,
    escopo: d.escopo,
    status: d.status,
    progresso,
    alertaVencimento: calcAlertaVencimento(d.vencimentoDia),
    createdAt: d.createdAt.toISOString(),
  };
}

// ─── GET /api/debts ──────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { user, coupleId, isCouple } = auth;

  const includeQuitadas = req.nextUrl.searchParams.get("incluir_quitadas") === "true";

  const where = {
    ...(isCouple && coupleId
      ? { OR: [{ coupleId }, { userId: user.id }] }
      : { userId: user.id }),
    ...(!includeQuitadas ? { status: "ATIVA" as const } : {}),
  };

  const debts = await prisma.debt.findMany({
    where,
    orderBy: [{ status: "asc" }, { taxaJuros: "desc" }, { createdAt: "asc" }],
  });

  // Renda mensal para cálculo de comprometimento
  const mesStart = new Date();
  mesStart.setDate(1);
  const mesEnd = new Date(mesStart.getFullYear(), mesStart.getMonth() + 1, 0, 23, 59, 59);

  const rendaAgg = await prisma.income.aggregate({
    where: {
      ...(isCouple && coupleId
        ? { OR: [{ userId: user.id }, ...(coupleId ? [] : [])] }
        : { userId: user.id }),
      mesReferencia: { gte: mesStart, lte: mesEnd },
    },
    _sum: { valor: true },
  });

  // Renda total do casal
  let rendaMensal = toNum(rendaAgg._sum.valor);
  if (isCouple && coupleId) {
    const couple = await prisma.couple.findUnique({
      where: { id: coupleId },
      select: { userAId: true, userBId: true },
    });
    if (couple?.userBId) {
      const rendaB = await prisma.income.aggregate({
        where: { userId: couple.userBId, mesReferencia: { gte: mesStart, lte: mesEnd } },
        _sum: { valor: true },
      });
      rendaMensal += toNum(rendaB._sum.valor);
    }
  }

  const mapped = debts.map(mapDebt);
  const ativas = mapped.filter((d) => d.status === "ATIVA");
  const quitadas = mapped.filter((d) => d.status === "QUITADA");

  const totalDividas = ativas.reduce((s, d) => s + d.valorRestante, 0);
  const totalParcelas = ativas.reduce((s, d) => s + d.parcelaMensal, 0);
  const comprometimento = rendaMensal > 0 ? (totalParcelas / rendaMensal) * 100 : 0;

  return NextResponse.json({
    debts: ativas,
    historico: quitadas,
    resumo: {
      totalDividas,
      totalParcelas,
      rendaMensal,
      comprometimento,
      alertaComprometimento: comprometimento > 30,
    },
  });
}

// ─── POST /api/debts ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { user, coupleId, isCouple } = auth;

  const body = await req.json();
  const parsed = CreateDebtSchema.safeParse(body);
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

  const debt = await prisma.debt.create({
    data: {
      userId: user.id,
      coupleId: escopo === "COMPARTILHADA" && isCouple ? coupleId : null,
      nome,
      valorTotal: valor_total,
      valorRestante: valor_restante,
      parcelasTotal: parcelas_total ?? null,
      parcelasPagas: parcelas_pagas,
      taxaJuros: taxa_juros_mensal ?? null,
      vencimentoDia: dia_vencimento ?? null,
      escopo,
    },
  });

  return NextResponse.json({ debt: mapDebt(debt) }, { status: 201 });
}
