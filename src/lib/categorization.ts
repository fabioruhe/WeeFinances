import { prisma } from "@/lib/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MatchResult = {
  categoriaId: string;
  subcategoriaId: string | null;
  confianca: "alta" | "media" | "nenhuma";
  fonte: "regra" | "historico";
  ruleId: string | null;
  ruleSource: "SISTEMA" | "USUARIO" | null;
};

// ─── normalizeText ────────────────────────────────────────────────────────────

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// ─── matchMerchantRule ────────────────────────────────────────────────────────

/**
 * Busca regras de merchant para a descrição informada.
 * Prioridade: regras do casal antes das globais (SISTEMA).
 */
export async function matchMerchantRule(
  descricao: string,
  coupleId: string | null
): Promise<MatchResult | null> {
  const norm = normalizeText(descricao);
  if (!norm || norm.length < 2) return null;

  const rules = await prisma.merchantRule.findMany({
    where: {
      OR: [
        ...(coupleId ? [{ coupleId }] : []),
        { coupleId: null },
      ],
    },
    select: {
      id: true,
      keyword: true,
      categoriaId: true,
      subcategoriaId: true,
      source: true,
      coupleId: true,
    },
  });

  // Exact match first, then partial — casal rules take priority over global
  const coupleRules = rules.filter((r) => r.coupleId !== null);
  const globalRules = rules.filter((r) => r.coupleId === null);

  function findMatch(list: typeof rules) {
    // Exact match
    const exact = list.find((r) => norm === normalizeText(r.keyword));
    if (exact) return { rule: exact, confianca: "alta" as const };
    // Partial match
    const partial = list.find(
      (r) =>
        norm.includes(normalizeText(r.keyword)) ||
        normalizeText(r.keyword).includes(norm)
    );
    if (partial) return { rule: partial, confianca: "media" as const };
    return null;
  }

  const coupleMatch = findMatch(coupleRules);
  if (coupleMatch) {
    return {
      categoriaId: coupleMatch.rule.categoriaId,
      subcategoriaId: coupleMatch.rule.subcategoriaId,
      confianca: coupleMatch.confianca,
      fonte: "regra",
      ruleId: coupleMatch.rule.id,
      ruleSource: coupleMatch.rule.source as "SISTEMA" | "USUARIO",
    };
  }

  const globalMatch = findMatch(globalRules);
  if (globalMatch) {
    return {
      categoriaId: globalMatch.rule.categoriaId,
      subcategoriaId: globalMatch.rule.subcategoriaId,
      confianca: globalMatch.confianca,
      fonte: "regra",
      ruleId: globalMatch.rule.id,
      ruleSource: globalMatch.rule.source as "SISTEMA" | "USUARIO",
    };
  }

  return null;
}

// ─── detectarAnomalia ─────────────────────────────────────────────────────────

/**
 * Detecta se o valor da transação é anômalo em relação ao histórico de 3 meses.
 * Retorna true se o valor for > média + 2 * desvio padrão, ou se a soma do mês > 150% da média mensal.
 */
export async function detectarAnomalia(
  userId: string,
  coupleId: string | null,
  categoriaId: string,
  valor: number,
  data: Date
): Promise<boolean> {
  const now = data;
  const mesAtualStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Buscar transações dos últimos 3 meses para a categoria
  const tresMesesAtras = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const tresMesesFim = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const where = coupleId
    ? { coupleId, categoriaId, tipo: "DESPESA" as const, deletedAt: null }
    : { userId, categoriaId, tipo: "DESPESA" as const, deletedAt: null };

  const txHistorico = await prisma.transaction.findMany({
    where: { ...where, data: { gte: tresMesesAtras, lte: tresMesesFim } },
    select: { valor: true, data: true },
  });

  if (txHistorico.length < 3) return false;

  const valores = txHistorico.map((t) => Number(t.valor));

  // Desvio padrão por transação individual
  const media = valores.reduce((a, b) => a + b, 0) / valores.length;
  const variancia =
    valores.reduce((sum, v) => sum + Math.pow(v - media, 2), 0) / valores.length;
  const desvio = Math.sqrt(variancia);

  if (valor > media + 2 * desvio) {
    console.log("[ANOMALIA] Detectada:", {
      categoria: categoriaId,
      valor,
      media: Math.round(media),
      desvio: Math.round(desvio),
    });
    return true;
  }

  // Verificar soma do mês atual vs média mensal histórica
  const txMesAtual = await prisma.transaction.aggregate({
    where: { ...where, data: { gte: mesAtualStart } },
    _sum: { valor: true },
  });

  const somaMes = Number(txMesAtual._sum.valor ?? 0) + valor;

  // Agrupar histórico por mês para calcular média mensal
  const mesesMap: Record<string, number> = {};
  for (const tx of txHistorico) {
    const key = `${tx.data.getFullYear()}-${tx.data.getMonth()}`;
    mesesMap[key] = (mesesMap[key] ?? 0) + Number(tx.valor);
  }
  const mediaMensal =
    Object.values(mesesMap).reduce((a, b) => a + b, 0) /
    Math.max(Object.keys(mesesMap).length, 1);

  if (mediaMensal > 0 && somaMes > mediaMensal * 1.5) {
    console.log("[ANOMALIA] Detectada:", {
      categoria: categoriaId,
      somaMes: Math.round(somaMes),
      mediaMensal: Math.round(mediaMensal),
    });
    return true;
  }

  return false;
}

// ─── extractKeyword ───────────────────────────────────────────────────────────

const STOPWORDS = new Set([
  "de", "da", "do", "das", "dos", "em", "no", "na", "nos", "nas",
  "a", "o", "as", "os", "e", "ou", "para", "por", "com", "sem",
  "um", "uma", "uns", "umas", "ao", "aos", "as",
]);

/**
 * Extrai a palavra-chave mais relevante de uma descrição (ignora artigos/preposições).
 */
export function extractKeyword(descricao: string): string | null {
  const words = normalizeText(descricao)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));

  return words[0] ?? null;
}
