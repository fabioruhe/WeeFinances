import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";

const CreateAssetSchema = z.object({
  nome: z.string().min(2).max(100),
  tipo: z.enum([
    "RENDA_FIXA", "RENDA_VARIAVEL", "FUNDO", "FII", "IMOVEL",
    "VEICULO", "CRIPTO", "PREVIDENCIA", "POUPANCA", "OUTRO",
  ]),
  instituicao: z.string().max(100).optional().nullable(),
  ticker: z.string().max(20).optional().nullable(),
  valor_atual: z.number().min(0),
  valor_investido: z.number().min(0),
  data_aquisicao: z.string().optional().nullable(),
  notas: z.string().max(500).optional().nullable(),
});

function toNum(v: unknown): number {
  if (v === null || v === undefined) return 0;
  return typeof v === "object" && "toNumber" in (v as object)
    ? (v as { toNumber(): number }).toNumber()
    : Number(v);
}

function mapAsset(a: {
  id: string; nome: string; tipo: string; instituicao: string | null;
  ticker: string | null; valorAtual: unknown; valorInvestido: unknown;
  ativo: boolean; createdAt: Date;
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
    valorAtual,
    valorInvestido,
    rentabilidade,
    rentabilidadePct,
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

  const { nome, tipo, instituicao, ticker, valor_atual, valor_investido, data_aquisicao, notas } = parsed.data;

  const asset = await prisma.asset.create({
    data: {
      userId: user.id,
      coupleId: isCouple ? coupleId : null,
      nome,
      tipo,
      instituicao: instituicao ?? null,
      ticker: ticker ?? null,
      valorAtual: valor_atual,
      valorInvestido: valor_investido,
      dataAquisicao: data_aquisicao ? new Date(data_aquisicao) : null,
      notas: notas ?? null,
    },
  });

  return NextResponse.json({ asset: mapAsset(asset) }, { status: 201 });
}
