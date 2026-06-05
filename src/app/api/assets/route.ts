import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";
import type { AssetType } from "@prisma/client";

const TICKER_TYPES = ["ACAO", "FII", "FUNDO_INVESTIMENTO"] as const;

const CreateAssetSchema = z.object({
  tipo: z.enum([
    "ACAO", "FUNDO_INVESTIMENTO", "FII", "CRIPTO", "TESOURO_DIRETO", "RENDA_FIXA",
    // deprecated — aceitos para backward compat
    "RENDA_VARIAVEL", "FUNDO", "IMOVEL", "VEICULO", "PREVIDENCIA", "POUPANCA", "OUTRO",
  ]),
  nome: z.string().max(100).optional().nullable(),
  instituicao: z.string().max(100).optional().nullable(),
  ticker: z.string().max(20).optional().nullable(),
  quantidade: z.number().positive().optional().nullable(),
  preco_unitario: z.number().positive().optional().nullable(),
  valor_atual: z.number().min(0).optional().nullable(),
  valor_investido: z.number().min(0).optional().nullable(),
  data_aquisicao: z.string().optional().nullable(),
  notas: z.string().max(500).optional().nullable(),
}).superRefine((data, ctx) => {
  const isTicker = (TICKER_TYPES as readonly string[]).includes(data.tipo);

  if (isTicker) {
    if (!data.ticker || data.ticker.trim().length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Ticker é obrigatório", path: ["ticker"] });
    }
    if (!data.instituicao || data.instituicao.trim().length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Instituição é obrigatória", path: ["instituicao"] });
    }
    if (!data.quantidade || data.quantidade <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Quantidade é obrigatória", path: ["quantidade"] });
    }
    if (!data.preco_unitario || data.preco_unitario <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Preço unitário é obrigatório", path: ["preco_unitario"] });
    }
    if (!data.data_aquisicao) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Data de aquisição é obrigatória", path: ["data_aquisicao"] });
    }
  } else {
    if (!data.nome || data.nome.trim().length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Nome é obrigatório (mín. 2 caracteres)", path: ["nome"] });
    }
    if (data.valor_investido === undefined || data.valor_investido === null || data.valor_investido < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Valor investido é obrigatório", path: ["valor_investido"] });
    }
    if (data.valor_atual === undefined || data.valor_atual === null || data.valor_atual < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Valor atual é obrigatório", path: ["valor_atual"] });
    }
    if (!data.data_aquisicao) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Data de aquisição é obrigatória", path: ["data_aquisicao"] });
    }
  }
});

function toNum(v: unknown): number {
  if (v === null || v === undefined) return 0;
  return typeof v === "object" && "toNumber" in (v as object)
    ? (v as { toNumber(): number }).toNumber()
    : Number(v);
}

function mapAsset(a: {
  id: string; nome: string | null; tipo: string; instituicao: string | null;
  ticker: string | null; quantidade: unknown; precoUnitario: unknown;
  valorAtual: unknown; valorInvestido: unknown;
  dataAquisicao: Date | null; ativo: boolean; createdAt: Date;
}) {
  const valorAtual = toNum(a.valorAtual);
  const valorInvestido = toNum(a.valorInvestido);
  const rentabilidade = valorAtual - valorInvestido;
  const rentabilidadePct = valorInvestido > 0 ? (rentabilidade / valorInvestido) * 100 : 0;
  return {
    id: a.id,
    nome: a.nome,
    tipo: a.tipo,
    instituicao: a.instituicao,
    ticker: a.ticker,
    quantidade: a.quantidade !== null ? toNum(a.quantidade) : null,
    precoUnitario: a.precoUnitario !== null ? toNum(a.precoUnitario) : null,
    valorAtual,
    valorInvestido,
    rentabilidade,
    rentabilidadePct,
    dataAquisicao: a.dataAquisicao?.toISOString().split("T")[0] ?? null,
    ativo: a.ativo,
    createdAt: a.createdAt.toISOString(),
  };
}

// ─── GET /api/assets ────────────────────────────────────────────────────────

export async function GET() {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { user, coupleId, isCouple } = auth;
  const where = isCouple && coupleId
    ? { coupleId, ativo: true }
    : { userId: user.id, coupleId: null, ativo: true };

  const assets = await prisma.asset.findMany({
    where,
    orderBy: [{ tipo: "asc" }, { valorAtual: "desc" }],
  });

  return NextResponse.json({ assets: assets.map(mapAsset) });
}

// ─── POST /api/assets ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { user, coupleId, isCouple } = auth;
  const body = await req.json();
  const parsed = CreateAssetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const d = parsed.data;
  const isTicker = (TICKER_TYPES as readonly string[]).includes(d.tipo);

  let nome: string | null;
  let ticker: string | null;
  let valorAtual: number;
  let valorInvestido: number;
  let quantidade: number | null = null;
  let precoUnitario: number | null = null;

  if (isTicker) {
    ticker = d.ticker!.toUpperCase().trim();
    nome = d.nome?.trim() || ticker;
    quantidade = d.quantidade!;
    precoUnitario = d.preco_unitario!;
    valorInvestido = Math.round(quantidade * precoUnitario * 100) / 100;
    valorAtual = valorInvestido;
  } else {
    nome = d.nome!;
    ticker = d.ticker?.toUpperCase().trim() || null;
    valorAtual = d.valor_atual!;
    valorInvestido = d.valor_investido!;
  }

  const asset = await prisma.asset.create({
    data: {
      userId: user.id,
      coupleId: isCouple ? coupleId : null,
      nome,
      tipo: d.tipo as AssetType,
      instituicao: d.instituicao ?? null,
      ticker,
      quantidade,
      precoUnitario,
      valorAtual,
      valorInvestido,
      dataAquisicao: d.data_aquisicao ? new Date(d.data_aquisicao) : null,
      notas: d.notas ?? null,
    },
  });

  return NextResponse.json({ asset: mapAsset(asset) }, { status: 201 });
}
