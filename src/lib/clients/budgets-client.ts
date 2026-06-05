import { apiRequest } from "@/lib/api-client";
import type { BudgetGrupo, BudgetStatus } from "@/lib/budget-utils";

export type { BudgetGrupo, BudgetStatus };

export type BudgetItem = {
  categoria: { id: string; nome: string; icone: string | null };
  budgetId: string | null;
  limite: number | null;
  gasto_atual: number;
  percentual: number | null;
  status: BudgetStatus;
  grupo: BudgetGrupo;
};

export type BudgetSugestao = {
  categoriaId: string;
  categoriaNome: string;
  icone: string | null;
  limiteSugerido: number;
  grupo: BudgetGrupo;
};

export type GenerateResult = {
  sugestoes: BudgetSugestao[];
  rendaTotal: number;
  totalSugerido: number;
  distribuicao: {
    NECESSIDADES: number;
    DESEJOS: number;
    FUTURO: number;
  };
};

export async function getBudgets(mes: string) {
  return apiRequest<{ budgets: BudgetItem[]; mes: string }>(
    `/api/budgets?mes=${mes}`,
    undefined,
    "Não foi possível carregar os orçamentos."
  );
}

export async function upsertBudgets(
  items: { categoriaId: string; limiteMensal: number; mesReferencia: string }[]
) {
  return apiRequest<{ updated: number }>(
    "/api/budgets",
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(items),
    },
    "Não foi possível salvar os orçamentos."
  );
}

export async function generateBudget(mesReferencia: string) {
  return apiRequest<GenerateResult>(
    "/api/budgets/generate",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mesReferencia }),
    },
    "Não foi possível gerar a sugestão de orçamento."
  );
}
