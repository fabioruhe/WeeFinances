import { apiRequest } from "@/lib/api-client";

// ─── Asset Types ────────────────────────────────────────────────────────────

export type AssetType =
  | "RENDA_FIXA" | "RENDA_VARIAVEL" | "FUNDO" | "IMOVEL"
  | "VEICULO" | "CRIPTO" | "PREVIDENCIA" | "POUPANCA" | "OUTRO";

export type AssetItem = {
  id: string;
  nome: string;
  tipo: AssetType;
  instituicao: string | null;
  ticker: string | null;
  valorAtual: number;
  valorInvestido: number;
  rentabilidade: number;
  rentabilidadePct: number;
  ativo: boolean;
  createdAt: string;
};

export type CreateAssetInput = {
  nome: string;
  tipo: AssetType;
  instituicao?: string;
  ticker?: string;
  valor_atual: number;
  valor_investido: number;
  data_aquisicao?: string;
  notas?: string;
};

// ─── Patrimônio Types ───────────────────────────────────────────────────────

export type TipoBreakdown = {
  tipo: AssetType;
  valor: number;
  percentual: number;
};

export type PatrimonioSummary = {
  totalAtivos: number;
  totalDividas: number;
  patrimonioLiquido: number;
  variacao: number;
  variacaoPct: number;
  porTipo: TipoBreakdown[];
  evolucao12m: Array<{ mes: string; valor: number }>;
};

// ─── Dividend Types ─────────────────────────────────────────────────────────

export type DividendType = "DIVIDENDO" | "JCP" | "RENDIMENTO" | "ALUGUEL" | "OUTRO";

export type DividendItem = {
  id: string;
  valor: number;
  mesReferencia: string;
  descricao: string | null;
  tipo: DividendType;
  assetId: string | null;
  assetNome: string | null;
  createdAt: string;
};

export type DividendSummary = {
  mesAtual: number;
  media12Meses: number;
  projecaoAnual: number;
  evolucao12m: Array<{ mes: string; total: number; porTipo: Record<string, number> }>;
};

// ─── Fixed Expense Types ────────────────────────────────────────────────────

export type FixedExpenseItem = {
  id: string;
  nome: string;
  valorMedio: number;
  categoriaNome: string | null;
  prioridade: number;
};

// ─── Freedom Types ──────────────────────────────────────────────────────────

export type FreedomConta = {
  id: string;
  nome: string;
  valorMedio: number;
  coberto: number;
  percentual: number;
  status: "COBERTA" | "PARCIAL" | "PENDENTE";
};

export type FreedomData = {
  percentualGeral: number;
  totalDespesasFixas: number;
  totalProventos: number;
  contas: FreedomConta[];
  contasCobertas: number;
  contasTotal: number;
  proximaConquista: { nome: string; falta: number } | null;
};

// ─── Projeção Types ─────────────────────────────────────────────────────────

export type ProjecaoParams = {
  valor_inicial: number;
  aporte_mensal: number;
  taxa_anual: number;
  anos_projecao: number;
};

export type ProjecaoEntry = {
  ano: number;
  anoCalendario: number;
  aportesNoAno: number;
  jurosNoAno: number;
  saldoFinal: number;
  totalAportado: number;
  totalJuros: number;
  percentualJuros: number;
};

export type ProjecaoResult = {
  projecao: ProjecaoEntry[];
  resumo: {
    valorFinal: number;
    totalAportado: number;
    totalJuros: number;
    multiplicador: number;
    crossoverAno: number | null;
  };
};

export type ProjecaoAutoData = {
  valorAtual: number;
  aporteMedio: number;
  temDados: boolean;
};

// ─── API calls: Assets ──────────────────────────────────────────────────────

export async function listAssets() {
  return apiRequest<{ assets: AssetItem[] }>(
    "/api/assets",
    undefined,
    "Não foi possível carregar os ativos.",
  );
}

export async function createAsset(input: CreateAssetInput) {
  return apiRequest<{ asset: AssetItem }>(
    "/api/assets",
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) },
    "Não foi possível criar o ativo.",
  );
}

export async function updateAsset(id: string, data: { valor_atual?: number; nome?: string }) {
  return apiRequest<{ asset: AssetItem }>(
    `/api/assets/${id}`,
    { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) },
    "Não foi possível atualizar o ativo.",
  );
}

export async function deleteAsset(id: string) {
  return apiRequest<{ ok: true }>(
    `/api/assets/${id}`,
    { method: "DELETE" },
    "Não foi possível remover o ativo.",
  );
}

// ─── API calls: Patrimônio ──────────────────────────────────────────────────

export async function fetchPatrimonio() {
  return apiRequest<PatrimonioSummary>(
    "/api/patrimonio",
    undefined,
    "Não foi possível carregar o patrimônio.",
  );
}

// ─── API calls: Dividends ───────────────────────────────────────────────────

export async function listDividends(mes?: string) {
  const params = mes ? `?mes=${mes}` : "";
  return apiRequest<{ dividends: DividendItem[] }>(
    `/api/dividends${params}`,
    undefined,
    "Não foi possível carregar os proventos.",
  );
}

export async function createDividend(input: {
  valor: number;
  mes_referencia: string;
  tipo: DividendType;
  asset_id?: string | null;
  descricao?: string;
}) {
  return apiRequest<{ dividend: DividendItem }>(
    "/api/dividends",
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) },
    "Não foi possível registrar o provento.",
  );
}

export async function fetchDividendSummary() {
  return apiRequest<DividendSummary>(
    "/api/dividends/summary",
    undefined,
    "Não foi possível carregar o resumo.",
  );
}

// ─── API calls: Fixed Expenses ──────────────────────────────────────────────

export async function listFixedExpenses() {
  return apiRequest<{ expenses: FixedExpenseItem[] }>(
    "/api/fixed-expenses",
    undefined,
    "Não foi possível carregar as despesas fixas.",
  );
}

export async function createFixedExpense(input: {
  nome: string;
  valor_medio: number;
  categoria_id: string;
  prioridade?: number;
}) {
  return apiRequest<{ expense: FixedExpenseItem }>(
    "/api/fixed-expenses",
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) },
    "Não foi possível criar a despesa fixa.",
  );
}

// ─── API calls: Freedom ─────────────────────────────────────────────────────

export async function fetchFreedom() {
  return apiRequest<FreedomData>(
    "/api/freedom",
    undefined,
    "Não foi possível carregar o tracker de liberdade.",
  );
}

// ─── API calls: Projeção ────────────────────────────────────────────────────

export async function calculateProjecao(params: ProjecaoParams) {
  return apiRequest<ProjecaoResult>(
    "/api/patrimonio/projecao",
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(params) },
    "Não foi possível calcular a projeção.",
  );
}

export async function fetchProjecaoAuto() {
  return apiRequest<ProjecaoAutoData>(
    "/api/patrimonio/projecao/auto",
    undefined,
    "Não foi possível carregar os dados automáticos.",
  );
}

// ─── Constants ──────────────────────────────────────────────────────────────

export const ASSET_TYPE_LABEL: Record<AssetType, string> = {
  RENDA_FIXA: "Renda Fixa",
  RENDA_VARIAVEL: "Renda Variável",
  FUNDO: "Fundos",
  IMOVEL: "Imóveis",
  VEICULO: "Veículos",
  CRIPTO: "Cripto",
  PREVIDENCIA: "Previdência",
  POUPANCA: "Poupança",
  OUTRO: "Outros",
};

export const ASSET_TYPE_COLOR: Record<AssetType, string> = {
  RENDA_FIXA: "var(--brand-primary)",
  RENDA_VARIAVEL: "var(--brand-secondary)",
  FUNDO: "var(--partner-shared)",
  IMOVEL: "var(--brand-accent)",
  VEICULO: "var(--warning, #f59e0b)",
  CRIPTO: "var(--info, #3b82f6)",
  PREVIDENCIA: "var(--success)",
  POUPANCA: "var(--text-tertiary)",
  OUTRO: "var(--border)",
};

export const DIVIDEND_TYPE_LABEL: Record<DividendType, string> = {
  DIVIDENDO: "Dividendo",
  JCP: "JCP",
  RENDIMENTO: "Rendimento",
  ALUGUEL: "Aluguel",
  OUTRO: "Outro",
};
