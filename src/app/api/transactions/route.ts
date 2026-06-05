import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";
import {
  matchMerchantRule,
  detectarAnomalia,
  extractKeyword,
  normalizeText,
} from "@/lib/categorization";

// ─── Schema Zod ───────────────────────────────────────────────────────────────

const CreateTransactionSchema = z.object({
  valor: z.number().positive("Valor deve ser maior que zero"),
  tipo: z.enum(["RECEITA", "DESPESA"]),
  escopo: z.enum(["INDIVIDUAL", "COMPARTILHADA"]).default("INDIVIDUAL"),
  categoriaId: z.string().uuid().nullable().optional(),
  subcategoriaId: z.string().uuid().nullable().optional(),
  descricao: z
    .string()
    .min(2, "Descrição muito curta")
    .max(200, "Descrição muito longa"),
  data: z.string().refine((d) => {
    const date = new Date(d);
    return !isNaN(date.getTime());
  }, "Data inválida"),
  modo: z.enum(["UNICA", "FIXA", "PARCELADA"]).default("UNICA"),
  parcelas: z.number().int().min(2).max(60).optional(),
  meses: z.number().int().min(1).max(24).optional(),
  valorEhTotal: z.boolean().optional(),
  diaVencimento: z.number().int().min(1).max(31).optional(),
});

// ─── GET /api/transactions ────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { user, coupleId, isCouple } = auth;
  const params = req.nextUrl.searchParams;

  const mes = params.get("mes"); // ex: "2026-04"
  const escopo = params.get("escopo"); // "meu" | "compartilhado" | "todos"
  const categoriaId = params.get("categoria");
  const reviewedParam = params.get("reviewed"); // "false" para micro-revisão
  const limit = Math.min(parseInt(params.get("limit") ?? "50"), 100);
  const offset = parseInt(params.get("offset") ?? "0");

  console.log("[TX] Filtros aplicados:", { mes, escopo, categoriaId, reviewed: reviewedParam });

  // Montar filtros de data
  let dateFilter: { gte?: Date; lte?: Date } = {};
  if (mes) {
    const [year, month] = mes.split("-").map(Number);
    dateFilter = {
      gte: new Date(year, month - 1, 1),
      lte: new Date(year, month, 0, 23, 59, 59),
    };
  }

  // Filtro de escopo
  const whereBase: Record<string, unknown> = {
    deletedAt: null,
    ...(Object.keys(dateFilter).length ? { data: dateFilter } : {}),
    ...(categoriaId ? { categoriaId } : {}),
    ...(reviewedParam === "false" ? { reviewed: false } : {}),
  };

  let where: Record<string, unknown>;

  if (!isCouple || escopo === "meu") {
    where = { ...whereBase, userId: user.id };
  } else if (escopo === "compartilhado") {
    where = { ...whereBase, coupleId, escopo: "COMPARTILHADA" };
  } else {
    // "todos" — transações do usuário e do casal (compartilhadas)
    where = {
      ...whereBase,
      OR: [
        { userId: user.id },
        ...(coupleId ? [{ coupleId, escopo: "COMPARTILHADA" }] : []),
      ],
    };
  }

  const [total, transactions] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      orderBy: { data: "desc" },
      skip: offset,
      take: limit,
      select: {
        id: true,
        valor: true,
        tipo: true,
        escopo: true,
        descricao: true,
        data: true,
        reviewed: true,
        anomalia: true,
        categoriaFonte: true,
        userId: true,
        coupleId: true,
        categoria: { select: { id: true, nome: true, icone: true } },
        subcategoria: { select: { id: true, nome: true, icone: true } },
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({ transactions, total, limit, offset });
}

// ─── POST /api/transactions ───────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { user, coupleId, isCouple } = auth;

  const body = await req.json();
  console.log("[TX] Criando transação:", body);

  const parsed = CreateTransactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const {
    valor,
    tipo,
    escopo,
    descricao,
    data: dataStr,
    modo = "UNICA",
    parcelas,
    meses,
    valorEhTotal,
    diaVencimento,
  } = parsed.data;

  let { categoriaId, subcategoriaId } = parsed.data;
  const data = new Date(dataStr);

  // Validações de modo
  if (modo === "PARCELADA" && (!parcelas || parcelas < 2)) {
    return NextResponse.json(
      { error: "Número de parcelas obrigatório (mínimo 2)" },
      { status: 422 }
    );
  }

  // Para UNICA, validar que data não é futura
  if (modo === "UNICA" && data > new Date()) {
    return NextResponse.json(
      { error: "Data não pode ser futura para transação única" },
      { status: 422 }
    );
  }

  // Escopo COMPARTILHADA requer casal
  if (escopo === "COMPARTILHADA" && !isCouple) {
    return NextResponse.json(
      { error: "no_couple_for_shared" },
      { status: 400 }
    );
  }

  // ── Estratégia 1: Auto-categorização por MerchantRule ─────────────────────
  let matchResult = null;
  let sugestaoRegra = false;
  let categoriaFonte: "SISTEMA" | "USUARIO" | "MANUAL" = "MANUAL";

  if (tipo === "DESPESA" && descricao) {
    matchResult = await matchMerchantRule(descricao, coupleId);
    if (matchResult) {
      console.log("[CAT] Match encontrado:", {
        keyword: normalizeText(descricao),
        regra: matchResult.ruleId,
        confianca: matchResult.confianca,
      });

      // Se o usuário não especificou categoria, aplicar a sugerida
      if (!categoriaId) {
        categoriaId = matchResult.categoriaId;
        subcategoriaId = matchResult.subcategoriaId ?? undefined;
        categoriaFonte = matchResult.ruleSource === "USUARIO" ? "USUARIO" : "SISTEMA";

        // Incrementar hit_count da regra
        if (matchResult.ruleId) {
          await prisma.merchantRule.update({
            where: { id: matchResult.ruleId },
            data: { hitCount: { increment: 1 } },
          });
        }
      }
    } else {
      console.log("[CAT] Sem match para:", descricao);
    }
  }

  // Se categoria foi informada manualmente (sem match ou usuário sobrescreveu)
  if (categoriaId && !matchResult) {
    categoriaFonte = "MANUAL";
    // Verificar se devemos sugerir criação de regra (Estratégia 4)
    const keyword = extractKeyword(descricao);
    if (keyword && tipo === "DESPESA") {
      // Checar quantas vezes essa keyword foi usada manualmente com essa categoria
      const countSimilar = await prisma.transaction.count({
        where: {
          userId: user.id,
          categoriaId,
          categoriaFonte: "MANUAL",
          descricao: { contains: keyword, mode: "insensitive" },
          deletedAt: null,
        },
      });
      if (countSimilar >= 2) {
        sugestaoRegra = true;
      }
    }
  }

  // Calcular divisão para COMPARTILHADA
  let divisaoInfo: { parteA: number; parteB: number } | null = null;

  if (escopo === "COMPARTILHADA" && coupleId && tipo === "DESPESA") {
    const couple = await prisma.couple.findUnique({
      where: { id: coupleId },
      select: {
        divisaoTipo: true,
        userAId: true,
        userBId: true,
      },
    });

    if (couple?.divisaoTipo === "IGUALITARIA") {
      const metade = valor / 2;
      divisaoInfo = { parteA: metade, parteB: metade };
    } else if (couple?.divisaoTipo === "PROPORCIONAL") {
      // Buscar rendas do mês para calcular proporção
      const now = new Date();
      const mesStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const mesEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const [rendaA, rendaB] = await Promise.all([
        prisma.income.aggregate({
          where: { userId: couple.userAId, mesReferencia: { gte: mesStart, lte: mesEnd } },
          _sum: { valor: true },
        }),
        couple.userBId
          ? prisma.income.aggregate({
              where: { userId: couple.userBId, mesReferencia: { gte: mesStart, lte: mesEnd } },
              _sum: { valor: true },
            })
          : Promise.resolve({ _sum: { valor: null } }),
      ]);

      const rA = Number(rendaA._sum.valor ?? 0);
      const rB = Number(rendaB._sum.valor ?? 0);
      const total = rA + rB;

      if (total > 0) {
        divisaoInfo = {
          parteA: parseFloat(((valor * rA) / total).toFixed(2)),
          parteB: parseFloat(((valor * rB) / total).toFixed(2)),
        };
      } else {
        divisaoInfo = { parteA: valor / 2, parteB: valor / 2 };
      }
    }

    if (divisaoInfo) {
      console.log("[TX] Divisão calculada:", divisaoInfo);
    }
  }

  // ── Salvar transação(ões) ─────────────────────────────────────────────────
  const txSelect = {
    id: true,
    valor: true,
    tipo: true,
    escopo: true,
    descricao: true,
    data: true,
    reviewed: true,
    anomalia: true,
    categoriaFonte: true,
    recorrenciaId: true,
    parcelaAtual: true,
    parcelasTotal: true,
    isRecorrente: true,
    categoria: { select: { id: true, nome: true, icone: true } },
    subcategoria: { select: { id: true, nome: true, icone: true } },
  };

  const baseData = {
    userId: user.id,
    coupleId: escopo === "COMPARTILHADA" ? coupleId : null,
    tipo,
    escopo,
    categoriaId: categoriaId ?? null,
    subcategoriaId: subcategoriaId ?? null,
    categoriaFonte,
  };

  let transaction;
  let totalCriadas = 1;

  if (modo === "UNICA") {
    // Comportamento original
    transaction = await prisma.transaction.create({
      data: { ...baseData, valor, descricao, data },
      select: txSelect,
    });
  } else {
    // Gerar série (FIXA ou PARCELADA)
    const recorrenciaId = crypto.randomUUID();
    const n = modo === "PARCELADA" ? parcelas! : (meses ?? 12);
    const valorParcela = modo === "PARCELADA" && valorEhTotal
      ? Math.round((valor / n) * 100) / 100
      : valor;

    const dia = diaVencimento ?? data.getUTCDate();
    const txDatas: { data: Date; descricao: string; parcelaAtual: number | null; parcelasTotal: number | null; isRecorrente: boolean }[] = [];

    for (let i = 0; i < n; i++) {
      const txDate = new Date(data.getUTCFullYear(), data.getUTCMonth() + i, 1);
      // Ajustar dia (lidar com meses que não têm o dia escolhido)
      const lastDay = new Date(txDate.getFullYear(), txDate.getMonth() + 1, 0).getDate();
      txDate.setDate(Math.min(dia, lastDay));

      const txDescricao = modo === "PARCELADA"
        ? `${descricao} (${i + 1}/${n})`
        : descricao;

      txDatas.push({
        data: txDate,
        descricao: txDescricao,
        parcelaAtual: modo === "PARCELADA" ? i + 1 : null,
        parcelasTotal: modo === "PARCELADA" ? n : null,
        isRecorrente: modo === "FIXA",
      });
    }

    // Criar todas em batch
    await prisma.transaction.createMany({
      data: txDatas.map((td) => ({
        ...baseData,
        valor: valorParcela,
        descricao: td.descricao,
        data: td.data,
        recorrenciaId,
        parcelaAtual: td.parcelaAtual,
        parcelasTotal: td.parcelasTotal,
        isRecorrente: td.isRecorrente,
      })),
    });

    totalCriadas = n;

    // Buscar a primeira transação criada para retornar
    transaction = await prisma.transaction.findFirst({
      where: { recorrenciaId },
      orderBy: { data: "asc" },
      select: txSelect,
    });
  }

  // ── Estratégia 6: Detecção de anomalia (após salvar) ─────────────────────
  let anomalia = false;
  if (tipo === "DESPESA" && categoriaId && transaction) {
    anomalia = await detectarAnomalia(
      user.id,
      coupleId,
      categoriaId,
      modo === "UNICA" ? valor : (modo === "PARCELADA" && valorEhTotal ? Math.round((valor / (parcelas ?? 1)) * 100) / 100 : valor),
      data
    );

    if (anomalia) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { anomalia: true },
      });
    }
  }

  return NextResponse.json(
    {
      transaction: transaction ? { ...transaction, anomalia } : null,
      totalCriadas,
      sugestao_regra: sugestaoRegra,
      anomalia,
      divisao: divisaoInfo,
      match: matchResult
        ? {
            fonte: matchResult.fonte,
            confianca: matchResult.confianca,
          }
        : null,
    },
    { status: 201 }
  );
}
