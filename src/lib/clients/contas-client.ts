import { apiRequest } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

export type BankAccountTipo =
  | "CORRENTE" | "POUPANCA" | "INVESTIMENTO" | "CARTEIRA_DIGITAL" | "OUTRO";

export type ContaItem = {
  id: string;
  nome: string;
  tipo: BankAccountTipo;
  banco: string;
  cor: string;
  saldo: number | null;
  icone: string | null;
  padrao: boolean;
  ativo: boolean;
  createdAt: string;
};

export type CreateContaInput = {
  nome: string;
  tipo: BankAccountTipo;
  banco: string;
  cor: string;
  saldo?: number | null;
  icone?: string | null;
  padrao?: boolean;
};

export type UpdateContaInput = Partial<CreateContaInput>;

// ─── Constants ──────────────────────────────────────────────────────────────

export const CONTA_TIPO_LABEL: Record<BankAccountTipo, string> = {
  CORRENTE: "Conta Corrente",
  POUPANCA: "Poupanca",
  INVESTIMENTO: "Investimento",
  CARTEIRA_DIGITAL: "Carteira Digital",
  OUTRO: "Outro",
};

export type BancoPopular = {
  nome: string;
  cor: string;
};

export const BANCOS_POPULARES: BancoPopular[] = [
  { nome: "Nubank", cor: "#8B5CF6" },
  { nome: "Itau", cor: "#FF6600" },
  { nome: "Bradesco", cor: "#CC092F" },
  { nome: "Banco do Brasil", cor: "#FECB00" },
  { nome: "Inter", cor: "#FF7A00" },
  { nome: "Santander", cor: "#EC0000" },
  { nome: "C6 Bank", cor: "#242424" },
  { nome: "Caixa", cor: "#0070AF" },
  { nome: "BTG Pactual", cor: "#003865" },
  { nome: "XP", cor: "#1D1D1D" },
  { nome: "Sicoob", cor: "#003641" },
  { nome: "Sicredi", cor: "#33A02C" },
  { nome: "PicPay", cor: "#21C25E" },
  { nome: "Mercado Pago", cor: "#009EE3" },
  { nome: "PagBank", cor: "#00A868" },
  { nome: "Neon", cor: "#0098DA" },
];

export const PALETA_CORES = [
  "#8B5CF6", "#EC4899", "#EF4444", "#F97316", "#F59E0B",
  "#22C55E", "#14B8A6", "#06B6D4", "#3B82F6", "#6366F1",
  "#A855F7", "#1D1D1D",
];

// ─── API calls ──────────────────────────────────────────────────────────────

export async function listContas() {
  return apiRequest<{ contas: ContaItem[] }>(
    "/api/contas",
    undefined,
    "Nao foi possivel carregar as contas.",
  );
}

export async function createConta(input: CreateContaInput) {
  return apiRequest<{ conta: ContaItem }>(
    "/api/contas",
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) },
    "Nao foi possivel criar a conta.",
  );
}

export async function updateConta(id: string, data: UpdateContaInput) {
  return apiRequest<{ conta: ContaItem }>(
    `/api/contas/${id}`,
    { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) },
    "Nao foi possivel atualizar a conta.",
  );
}

export async function deleteConta(id: string) {
  return apiRequest<{ ok: true }>(
    `/api/contas/${id}`,
    { method: "DELETE" },
    "Nao foi possivel remover a conta.",
  );
}
