import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";

function toNum(v: unknown): number {
  if (v === null || v === undefined) return 0;
  return typeof v === "object" && "toNumber" in (v as object)
    ? (v as { toNumber(): number }).toNumber()
    : Number(v);
}

const CreateDividendSchema = z.object({
  valor: z.number().min(0.01),
  mes_referencia: z.string().regex(/^\d{4}-\d{2}$/),
  tipo: z.enum(["DIVIDENDO", "JCP", "RENDIMENTO", "ALUGUEL", "OUTRO"]),
  asset_id: z.string().optional().nullable(),
  descricao: z.string().max(200).optional().nullable(),
});

// ─── GET /api/dividends ──────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { user, coupleId, isCouple } = auth;
  const ownerWhere = isCouple && coupleId
    ? { coupleId }
    : { userId: user.id, coupleId: null };

  const mes = req.nextUrl.searchParams.get("mes");

  const where: Record<string, unknown> = { ...ownerWhere };
  if (mes) {
    const [y, m] = mes.split("-").map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 1);
    where.mesReferencia = { gte: start, lt: end };
  }

  const dividends = await prisma.dividendEntry.findMany({
    where,
    include: { asset: { select: { nome: true } } },
    orderBy: { mesReferencia: "desc" },
  });

  return NextResponse.json({
    dividends: dividends.map((d) => ({
      id: d.id,
      valor: toNum(d.valor),
      mesReferencia: d.mesReferencia.toISOString().slice(0, 10),
      descricao: d.descricao,
      tipo: d.tipo,
      assetId: d.assetId,
      assetNome: d.asset?.nome ?? null,
      createdAt: d.createdAt.toISOString(),
    })),
  });
}

// ─── POST /api/dividends ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { user, coupleId, isCouple } = auth;
  const body = await req.json();
  const parsed = CreateDividendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { valor, mes_referencia, tipo, asset_id, descricao } = parsed.data;
  const [y, m] = mes_referencia.split("-").map(Number);

  const dividend = await prisma.dividendEntry.create({
    data: {
      userId: user.id,
      coupleId: isCouple ? coupleId : null,
      assetId: asset_id ?? null,
      valor,
      mesReferencia: new Date(y, m - 1, 1),
      tipo,
      descricao: descricao ?? null,
    },
    include: { asset: { select: { nome: true } } },
  });

  return NextResponse.json({
    dividend: {
      id: dividend.id,
      valor: toNum(dividend.valor),
      mesReferencia: dividend.mesReferencia.toISOString().slice(0, 10),
      descricao: dividend.descricao,
      tipo: dividend.tipo,
      assetId: dividend.assetId,
      assetNome: dividend.asset?.nome ?? null,
      createdAt: dividend.createdAt.toISOString(),
    },
  }, { status: 201 });
}
