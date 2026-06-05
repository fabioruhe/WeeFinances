import { apiRequest } from "@/lib/api-client";

// ─── Types ───────────────────────────────────────────────────────────────────

export type CategoriaGasto = {
  nome: string;
  icone: string | null;
  valor: number;
  percentual: number;
};

export type TopGasto = {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  categoria: string | null;
};

export type Insight = {
  tipo: "info" | "success" | "warning";
  texto: string;
};

export type MonthlyReport = {
  mes: string;
  receitas: number;
  despesas: number;
  saldo: number;
  gastosPorCategoria: CategoriaGasto[];
  topGastos: TopGasto[];
  comparativo: {
    mesAnterior: string;
    despesasAnterior: number;
    variacao: number; // percentual
  } | null;
  insights: Insight[];
  isCouple: boolean;
};

export type EvolutionEntry = {
  mes: string;
  receitas: number;
  despesas: number;
  poupanca: number;
};

export type EvolutionReport = {
  evolucao: EvolutionEntry[];
  isCouple: boolean;
};

export type CoupleContrib = {
  userId: string;
  nome: string;
  receitas: number;
  despesas: number;
  despesasCompartilhadas: number;
};

export type CoupleReport = {
  parceiros: CoupleContrib[];
  saldoEntre: number; // positivo = A pagou mais
  nomeA: string;
  nomeB: string;
  mes: string;
};

// ─── API calls ───────────────────────────────────────────────────────────────

export async function fetchMonthlyReport(mes?: string) {
  const params = new URLSearchParams({ tipo: "mensal" });
  if (mes) params.set("mes", mes);
  return apiRequest<MonthlyReport>(
    `/api/reports?${params}`,
    undefined,
    "Não foi possível carregar o relatório mensal.",
  );
}

export async function fetchEvolution() {
  return apiRequest<EvolutionReport>(
    "/api/reports?tipo=evolucao",
    undefined,
    "Não foi possível carregar a evolução.",
  );
}

export async function fetchCoupleReport(mes?: string) {
  const params = new URLSearchParams({ tipo: "casal" });
  if (mes) params.set("mes", mes);
  return apiRequest<CoupleReport>(
    `/api/reports?${params}`,
    undefined,
    "Não foi possível carregar o relatório do casal.",
  );
}
