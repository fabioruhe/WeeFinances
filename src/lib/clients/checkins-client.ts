import { apiRequest } from "@/lib/api-client";

// ─── Types ───────────────────────────────────────────────────────────────────

export type CategoriaEstourada = {
  categoriaId: string;
  nome: string;
  icone: string | null;
  budgetId: string | null;
  limite: number;
  gasto: number;
  excesso: number;
  percentual: number;
};

export type CategoriaAbaixo = {
  categoriaId: string;
  nome: string;
  icone: string | null;
  limite: number;
  gasto: number;
  percentual: number;
};

export type MetaProgresso = {
  id: string;
  nome: string;
  tipo: string;
  valorAlvo: number;
  valorAtual: number;
  progresso: number;
  contribuicaoMes: number;
  projecaoConclusao: string | null;
};

export type DividaPagamento = {
  id: string;
  nome: string;
  valorPago: number;
  valorRestante: number;
};

export type CheckinPreview = {
  isCouple: boolean;
  userId: string;
  jaFezCheckin: boolean;
  // Step 1 — Revisão
  receitas: number;
  despesas: number;
  saldo: number;
  categoriasEstouradas: CategoriaEstourada[];
  categoriasAbaixo: CategoriaAbaixo[];
  totalCategorias: number;
  categoriasDentro: number;
  // Step 2 — Celebração
  metasAvancaram: MetaProgresso[];
  dividasPagas: DividaPagamento[];
  valorEconomizado: number;
  // Step 3 — Ajustes (reusa categoriasEstouradas)
  // Step 4 — Metas
  metasAtivas: MetaProgresso[];
};

export type BudgetAdjustment = {
  categoriaId: string;
  novoLimite: number;
  mesReferencia: string;
};

export type CheckinCreateInput = {
  mes: string; // YYYY-MM
  sentimentoA: number;
  sentimentoB?: number | null;
  ajustes?: BudgetAdjustment[];
  resumoJson: Record<string, unknown>;
};

export type CheckinHistoryItem = {
  id: string;
  data: string;
  sentimentoA: number;
  sentimentoB: number | null;
  resumoJson: Record<string, unknown> | null;
  createdAt: string;
};

// ─── API calls ───────────────────────────────────────────────────────────────

export async function fetchCheckinPreview(mes?: string) {
  const params = mes ? `?mes=${mes}` : "";
  return apiRequest<CheckinPreview>(
    `/api/checkins/preview${params}`,
    undefined,
    "Não foi possível carregar os dados do check-in.",
  );
}

export async function createCheckin(input: CheckinCreateInput) {
  return apiRequest<{ checkin: { id: string } }>(
    "/api/checkins",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    "Não foi possível salvar o check-in.",
  );
}

export async function listCheckins(limit?: number) {
  const params = limit ? `?limit=${limit}` : "";
  return apiRequest<{ checkins: CheckinHistoryItem[] }>(
    `/api/checkins${params}`,
    undefined,
    "Não foi possível carregar o histórico.",
  );
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const STEP_LABELS_COUPLE = [
  "Revisão do Mês",
  "Celebração",
  "Ajustes",
  "Metas",
  "Sentimento",
];

export const STEP_LABELS_SOLO = [
  "Revisão do Mês",
  "Celebração",
  "Ajustes",
  "Metas & Sentimento",
];

export const SENTIMENT_EMOJI = ["", "😟", "😐", "🙂", "😊", "😄"];
export const SENTIMENT_LABELS = [
  "",
  "Preocupado(a)",
  "Apreensivo(a)",
  "Neutro(a)",
  "Bem",
  "Tranquilo(a)",
];
