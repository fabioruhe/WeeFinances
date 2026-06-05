export type BudgetGrupo = "NECESSIDADES" | "DESEJOS" | "FUTURO";
export type BudgetStatus = "NORMAL" | "ATENCAO" | "CRITICO" | "ESTOURADO" | "SEM_LIMITE";

// ─── Classificação de categorias ─────────────────────────────────────────────

export function getCategoriaGrupo(nome: string): BudgetGrupo {
  const n = nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const FUTURO_KEYS = [
    "invest", "reserva", "meta", "poupc", "aposentad",
    "previdencia", "seguro vida", "futuro",
  ];
  const NECESSIDADES_KEYS = [
    "mora", "transport", "aliment", "comida", "saude",
    "mercado", "farmacia", "medic", "agua", "energia",
    "gas", "internet", "aluguel", "condomin", "utilidade",
    "educacao", "escola", "creche", "plano",
  ];

  if (FUTURO_KEYS.some((k) => n.includes(k))) return "FUTURO";
  if (NECESSIDADES_KEYS.some((k) => n.includes(k))) return "NECESSIDADES";
  return "DESEJOS";
}

// ─── Cálculo de status ────────────────────────────────────────────────────────

export const STATUS_ORDER: Record<BudgetStatus, number> = {
  ESTOURADO: 0,
  CRITICO: 1,
  ATENCAO: 2,
  NORMAL: 3,
  SEM_LIMITE: 4,
};

export function computeStatus(
  gasto: number,
  limite: number | null
): { status: BudgetStatus; percentual: number | null } {
  if (limite === null || limite === 0) {
    return { status: "SEM_LIMITE", percentual: null };
  }
  const percentual = (gasto / limite) * 100;
  let status: BudgetStatus;
  if (percentual > 100) status = "ESTOURADO";
  else if (percentual >= 90) status = "CRITICO";
  else if (percentual >= 70) status = "ATENCAO";
  else status = "NORMAL";
  return { status, percentual };
}

// ─── Helpers de data ─────────────────────────────────────────────────────────

export function parseMesStr(mes: string | null | undefined): { year: number; month: number } {
  const str = mes ?? new Date().toISOString().slice(0, 7);
  const [year, month] = str.split("-").map(Number);
  return { year, month };
}

export function mesReferenciaDate(year: number, month: number): Date {
  return new Date(year, month - 1, 1);
}

export function mesToLabel(mes: string): string {
  const [year, month] = mes.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}
