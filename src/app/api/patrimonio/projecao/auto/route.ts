import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";

function toNum(v: unknown): number {
  if (v === null || v === undefined) return 0;
  return typeof v === "object" && "toNumber" in (v as object)
    ? (v as { toNumber(): number }).toNumber()
    : Number(v);
}

// ─── GET /api/patrimonio/projecao/auto ───────────────────────────────────────

export async function GET() {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { user, coupleId, isCouple } = auth;
  const ownerWhere = isCouple && coupleId
    ? { coupleId }
    : { userId: user.id, coupleId: null };

  // Current asset total
  const assets = await prisma.asset.findMany({
    where: { ...ownerWhere, ativo: true },
    select: { valorAtual: true },
  });
  const valorAtual = assets.reduce((s, a) => s + toNum(a.valorAtual), 0);

  // Average monthly investment (new assets created in last 6 months)
  const now = new Date();
  const start6m = new Date(now.getFullYear(), now.getMonth() - 6, 1);

  const recentAssets = await prisma.asset.findMany({
    where: {
      ...ownerWhere,
      createdAt: { gte: start6m },
    },
    select: { valorInvestido: true },
  });

  const totalInvestido6m = recentAssets.reduce((s, a) => s + toNum(a.valorInvestido), 0);
  const aporteMedio = recentAssets.length > 0 ? totalInvestido6m / 6 : 0;

  return NextResponse.json({
    valorAtual,
    aporteMedio: Math.round(aporteMedio * 100) / 100,
    temDados: assets.length > 0,
  });
}
