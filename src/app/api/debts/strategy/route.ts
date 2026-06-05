import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";

// ─── Tipos internos ───────────────────────────────────────────────────────────

type DebtSim = {
  id: string;
  nome: string;
  saldo: number;
  taxa: number; // mensal decimal, ex: 0.05 = 5%
  parcelaMensal: number;
};

type QuitacaoItem = {
  id: string;
  nome: string;
  mes: number;
  jurosTotal: number;
  economiaVsBaseline: number;
};

type SimulacaoResult = {
  estrategia: "AVALANCHE" | "BOLA_DE_NEVE";
  ordemQuitacao: QuitacaoItem[];
  mesesParaQuitar: number;
  totalJuros: number;
  economiaJuros: number;
  totalPagoExtra: number;
};

// ─── Núcleo do simulador ──────────────────────────────────────────────────────

function calcParcelaMensal(saldo: number, parcelasTotal: number | null, parcelasPagas: number): number {
  if (parcelasTotal && parcelasTotal > parcelasPagas) {
    return saldo / (parcelasTotal - parcelasPagas);
  }
  return Math.max(saldo * 0.05, 10); // 5% do saldo ou R$10 mínimo
}

/**
 * Simula o pagamento de dívidas com uma estratégia e um valor extra mensal.
 * Retorna os dados consolidados de cada dívida e o total de juros pagos.
 */
function simularDebts(
  debts: DebtSim[],
  valorExtra: number,
  estrategia: "AVALANCHE" | "BOLA_DE_NEVE",
): { quitacoes: QuitacaoItem[]; totalJuros: number; meses: number } {
  if (debts.length === 0) {
    return { quitacoes: [], totalJuros: 0, meses: 0 };
  }

  // Estado mutável de cada dívida
  type Estado = {
    id: string;
    nome: string;
    saldo: number;
    taxa: number;
    parcelaMensal: number;
    quitada: boolean;
    mesQuitacao: number;
    jurosAcumulados: number;
  };

  // Ordem fixa da estratégia (não muda ao longo da simulação)
  const ordenada =
    estrategia === "AVALANCHE"
      ? [...debts].sort((a, b) => b.taxa - a.taxa)  // maior juros primeiro
      : [...debts].sort((a, b) => a.saldo - b.saldo); // menor saldo primeiro

  const estados: Estado[] = ordenada.map((d) => ({
    id: d.id,
    nome: d.nome,
    saldo: d.saldo,
    taxa: d.taxa,
    parcelaMensal: d.parcelaMensal,
    quitada: false,
    mesQuitacao: 0,
    jurosAcumulados: 0,
  }));

  let mes = 0;
  const MAX_MESES = 360; // limite de 30 anos

  while (estados.some((e) => !e.quitada) && mes < MAX_MESES) {
    mes++;

    // Extra liberado por dívidas recém-quitadas neste mês
    let extraLiberado = valorExtra;

    // 1) Aplicar juros mensais e pagar parcela mínima em cada dívida
    for (const e of estados) {
      if (e.quitada) continue;

      const juros = e.saldo * e.taxa;
      e.jurosAcumulados += juros;
      e.saldo += juros;
      e.saldo -= e.parcelaMensal;

      if (e.saldo <= 0.01) {
        extraLiberado += e.parcelaMensal + Math.max(e.saldo, 0); // libera parcela para rolar
        e.saldo = 0;
        e.quitada = true;
        e.mesQuitacao = mes;
      }
    }

    // 2) Aplicar extra (snowball/avalanche) na primeira dívida não quitada da ordem
    if (extraLiberado > 0) {
      const alvo = estados.find((e) => !e.quitada);
      if (alvo) {
        alvo.saldo -= extraLiberado;
        if (alvo.saldo <= 0.01) {
          alvo.saldo = 0;
          alvo.quitada = true;
          alvo.mesQuitacao = mes;
        }
      }
    }
  }

  const totalJuros = estados.reduce((s, e) => s + e.jurosAcumulados, 0);
  const mesesFinal = estados.reduce((m, e) => Math.max(m, e.mesQuitacao), 0);

  const quitacoes: QuitacaoItem[] = estados.map((e) => ({
    id: e.id,
    nome: e.nome,
    mes: e.mesQuitacao,
    jurosTotal: e.jurosAcumulados,
    economiaVsBaseline: 0, // preenchido abaixo
  }));

  return { quitacoes, totalJuros, meses: mesesFinal };
}

/**
 * Simula sem valor extra (baseline) para calcular economia comparativa.
 */
function simularBaseline(debts: DebtSim[]): { totalJuros: number; meses: number } {
  const res = simularDebts(debts, 0, "AVALANCHE");
  return { totalJuros: res.totalJuros, meses: res.meses };
}

// ─── GET /api/debts/strategy ─────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { user, coupleId, isCouple } = auth;

  const valorExtraParam = req.nextUrl.searchParams.get("valor_extra_mensal");
  const valorExtra = Math.max(parseFloat(valorExtraParam ?? "0") || 0, 0);

  const debtsRaw = await prisma.debt.findMany({
    where: {
      ...(isCouple && coupleId
        ? { OR: [{ coupleId }, { userId: user.id }] }
        : { userId: user.id }),
      status: "ATIVA",
      valorRestante: { gt: 0 },
    },
    select: {
      id: true,
      nome: true,
      valorRestante: true,
      parcelasTotal: true,
      parcelasPagas: true,
      taxaJuros: true,
    },
    orderBy: { taxaJuros: "desc" },
  });

  if (debtsRaw.length === 0) {
    return NextResponse.json({
      avalanche: null,
      bolaNeve: null,
      semExtra: null,
      valorExtra,
    });
  }

  const toN = (v: unknown) =>
    typeof v === "object" && v !== null && "toNumber" in (v as object)
      ? (v as { toNumber(): number }).toNumber()
      : Number(v ?? 0);

  const debts: DebtSim[] = debtsRaw.map((d) => {
    const saldo = toN(d.valorRestante);
    const taxa = toN(d.taxaJuros) / 100;
    return {
      id: d.id,
      nome: d.nome,
      saldo,
      taxa,
      parcelaMensal: calcParcelaMensal(saldo, d.parcelasTotal, d.parcelasPagas),
    };
  });

  // Baseline: sem valor extra
  const baseline = simularBaseline(debts);

  // Avalanche
  const avalancheRaw = simularDebts(debts, valorExtra, "AVALANCHE");
  const bolaNeve = simularDebts(debts, valorExtra, "BOLA_DE_NEVE");

  // Calcular economia vs baseline para cada dívida
  const buildResult = (
    raw: ReturnType<typeof simularDebts>,
    estrategia: "AVALANCHE" | "BOLA_DE_NEVE",
  ): SimulacaoResult => ({
    estrategia,
    ordemQuitacao: raw.quitacoes.map((q) => ({
      ...q,
      economiaVsBaseline: 0,
    })),
    mesesParaQuitar: raw.meses,
    totalJuros: raw.totalJuros,
    economiaJuros: Math.max(baseline.totalJuros - raw.totalJuros, 0),
    totalPagoExtra: valorExtra * raw.meses,
  });

  return NextResponse.json({
    avalanche: buildResult(avalancheRaw, "AVALANCHE"),
    bolaNeve: buildResult(bolaNeve, "BOLA_DE_NEVE"),
    semExtra: {
      mesesParaQuitar: baseline.meses,
      totalJuros: baseline.totalJuros,
    },
    valorExtra,
  });
}
