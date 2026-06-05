import { apiRequest } from "@/lib/api-client";

// ─── Types ───────────────────────────────────────────────────────────────────

export type DebtEscopo = "INDIVIDUAL" | "COMPARTILHADA";
export type DebtStatus = "ATIVA" | "QUITADA";
export type AlertaVencimento = "HOJE" | "AMANHA" | "EM_BREVE" | null;

export type DebtItem = {
  id: string;
  nome: string;
  valorTotal: number;
  valorRestante: number;
  parcelasTotal: number | null;
  parcelasPagas: number;
  parcelasRestantes: number | null;
  taxaJuros: number;
  parcelaMensal: number;
  vencimentoDia: number | null;
  estrategia: string;
  escopo: DebtEscopo;
  status: DebtStatus;
  progresso: number;
  alertaVencimento: AlertaVencimento;
  createdAt: string;
};

export type DebtResumo = {
  totalDividas: number;
  totalParcelas: number;
  rendaMensal: number;
  comprometimento: number;
  alertaComprometimento: boolean;
};

export type ListDebtsResult = {
  debts: DebtItem[];
  historico: DebtItem[];
  resumo: DebtResumo;
};

export type CreateDebtInput = {
  nome: string;
  valor_total: number;
  valor_restante: number;
  parcelas_total?: number | null;
  parcelas_pagas?: number;
  taxa_juros_mensal?: number | null;
  dia_vencimento?: number | null;
  escopo?: DebtEscopo;
};

export type UpdateDebtInput = Partial<CreateDebtInput>;

export type QuitacaoItem = {
  id: string;
  nome: string;
  mes: number;
  jurosTotal: number;
  economiaVsBaseline: number;
};

export type SimulacaoResult = {
  estrategia: "AVALANCHE" | "BOLA_DE_NEVE";
  ordemQuitacao: QuitacaoItem[];
  mesesParaQuitar: number;
  totalJuros: number;
  economiaJuros: number;
  totalPagoExtra: number;
};

export type StrategyResult = {
  avalanche: SimulacaoResult | null;
  bolaNeve: SimulacaoResult | null;
  semExtra: { mesesParaQuitar: number; totalJuros: number } | null;
  valorExtra: number;
};

export type PayDebtResult = {
  payment: { id: string; valor: number };
  debt: { id: string; valorRestante: number; parcelasPagas: number; status: DebtStatus; progresso: number };
  quitada: boolean;
};

// ─── API calls ───────────────────────────────────────────────────────────────

export async function listDebts(incluirQuitadas = false) {
  return apiRequest<ListDebtsResult>(
    `/api/debts${incluirQuitadas ? "?incluir_quitadas=true" : ""}`,
    undefined,
    "Não foi possível carregar as dívidas.",
  );
}

export async function createDebt(input: CreateDebtInput) {
  return apiRequest<{ debt: DebtItem }>(
    "/api/debts",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    "Não foi possível criar a dívida.",
  );
}

export async function updateDebt(id: string, input: UpdateDebtInput) {
  return apiRequest<{ debt: DebtItem }>(
    `/api/debts/${id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    "Não foi possível atualizar a dívida.",
  );
}

export async function deleteDebt(id: string) {
  return apiRequest<{ ok: boolean }>(
    `/api/debts/${id}`,
    { method: "DELETE" },
    "Não foi possível excluir a dívida.",
  );
}

export async function getStrategy(valorExtraMensal: number) {
  return apiRequest<StrategyResult>(
    `/api/debts/strategy?valor_extra_mensal=${valorExtraMensal}`,
    undefined,
    "Não foi possível calcular a estratégia.",
  );
}

export async function payDebt(id: string, valorPago: number, data: string) {
  return apiRequest<PayDebtResult>(
    `/api/debts/${id}/pay`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ valor_pago: valorPago, data }),
    },
    "Não foi possível registrar o pagamento.",
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function taxaJurosLabel(taxa: number): "baixa" | "media" | "alta" | "critica" {
  if (taxa <= 1) return "baixa";
  if (taxa <= 3) return "media";
  if (taxa <= 8) return "alta";
  return "critica";
}

export function taxaJurosCor(taxa: number): string {
  const nivel = taxaJurosLabel(taxa);
  if (nivel === "baixa") return "var(--success)";
  if (nivel === "media") return "var(--warning)";
  if (nivel === "alta") return "var(--danger)";
  return "var(--danger)";
}

export function taxaJurosCardGradient(taxa: number): string {
  const nivel = taxaJurosLabel(taxa);
  if (nivel === "baixa") return "color-mix(in srgb, var(--success) 5%, var(--bg-card))";
  if (nivel === "media") return "color-mix(in srgb, var(--warning) 6%, var(--bg-card))";
  return "color-mix(in srgb, var(--danger) 7%, var(--bg-card))";
}
