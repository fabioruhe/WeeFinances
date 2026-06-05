import { apiRequest } from "@/lib/api-client";

// ─── Types ───────────────────────────────────────────────────────────────────

export type GoalTipo =
  | "EMERGENCIA"
  | "VIAGEM"
  | "IMOVEL"
  | "CARRO"
  | "CASAMENTO"
  | "FILHOS"
  | "APOSENTADORIA"
  | "EDUCACAO"
  | "OUTRO";

export type GoalStatus = "ATIVA" | "ATINGIDA" | "PAUSADA";

export type GoalItem = {
  id: string;
  nome: string;
  tipo: GoalTipo;
  valorAlvo: number;
  valorAtual: number;
  prazo: string | null;
  status: GoalStatus;
  contribuicaoA: number | null;
  contribuicaoB: number | null;
  prioridade: number;
  progresso: number;
  valorFaltante: number;
  mesesRestantes: number | null;
  valorMensalNecessario: number | null;
  projecaoConclusao: string | null;
  totalContribuicaoA: number;
  totalContribuicaoB: number;
  prazoVencido: boolean;
  createdAt: string;
};

export type CoupleCtx = {
  userAId: string;
  userANome: string | null;
  userBId: string | null;
  userBNome: string | null;
};

export type ListGoalsResult = {
  goals: GoalItem[];
  couple: CoupleCtx | null;
  userId: string;
};

export type CreateGoalInput = {
  nome: string;
  valor_alvo: number;
  prazo?: string | null;
  tipo: GoalTipo;
  contribuicao_a?: number | null;
  contribuicao_b?: number | null;
  prioridade?: number;
};

export type ContributeInput = {
  valor: number;
};

export type ContributeResult = {
  contribution: { id: string; valor: number };
  goal: { id: string; valorAtual: number; status: GoalStatus; progresso: number };
  celebrar: boolean;
};

// ─── API calls ───────────────────────────────────────────────────────────────

export async function listGoals() {
  return apiRequest<ListGoalsResult>(
    "/api/goals",
    undefined,
    "Não foi possível carregar as metas.",
  );
}

export async function createGoal(input: CreateGoalInput) {
  return apiRequest<{ goal: GoalItem }>(
    "/api/goals",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    "Não foi possível criar a meta.",
  );
}

export async function contributeToGoal(id: string, input: ContributeInput) {
  return apiRequest<ContributeResult>(
    `/api/goals/${id}/contribute`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    "Não foi possível registrar a contribuição.",
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const GOAL_EMOJI: Record<GoalTipo, string> = {
  EMERGENCIA: "🛡️",
  VIAGEM: "✈️",
  IMOVEL: "🏠",
  CARRO: "🚗",
  CASAMENTO: "💍",
  FILHOS: "👶",
  APOSENTADORIA: "🌴",
  EDUCACAO: "📚",
  OUTRO: "🎯",
};

export const GOAL_TIPO_LABEL: Record<GoalTipo, string> = {
  EMERGENCIA: "Reserva de Emergência",
  VIAGEM: "Viagem",
  IMOVEL: "Imóvel",
  CARRO: "Carro",
  CASAMENTO: "Casamento",
  FILHOS: "Filhos",
  APOSENTADORIA: "Aposentadoria",
  EDUCACAO: "Educação",
  OUTRO: "Outro",
};

export function calcProjecaoSimulada(
  valorAtual: number,
  valorAlvo: number,
  contribuicaoMensal: number,
): { meses: number; data: Date } | null {
  if (contribuicaoMensal <= 0) return null;
  const faltante = valorAlvo - valorAtual;
  if (faltante <= 0) return { meses: 0, data: new Date() };
  const meses = Math.ceil(faltante / contribuicaoMensal);
  const data = new Date();
  data.setMonth(data.getMonth() + meses);
  return { meses, data };
}

export function formatMesAno(date: Date): string {
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}
