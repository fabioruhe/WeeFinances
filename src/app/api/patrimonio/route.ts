import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";

function toNum(v: unknown): number {
  if (v === null || v === undefined) return 0;
  return typeof v === "object" && "toNumber" in (v as object)
    ? (v as { toNumber(): number }).toNumber()
    : Number(v);
}

// ─── GET /api/patrimonio ────────────────────────────────────────────────────

export async function GET() {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { user, coupleId, isCouple } = auth;

  const ownerWhere = isCouple && coupleId
    ? { coupleId }
    : { userId: user.id, coupleId: null };

  // Total ativos
  const assets = await prisma.asset.findMany({
    where: { ...ownerWhere, ativo: true },
    select: { tipo: true, valorAtual: true },
  });

  const totalAtivos = assets.reduce((s, a) => s + toNum(a.valorAtual), 0);

  // Por tipo
  const porTipoMap = new Map<string, number>();
  for (const a of assets) {
    const v = toNum(a.valorAtual);
    porTipoMap.set(a.tipo, (porTipoMap.get(a.tipo) ?? 0) + v);
  }
  const porTipo = [...porTipoMap.entries()]
    .map(([tipo, valor]) => ({
      tipo,
      valor,
      percentual: totalAtivos > 0 ? (valor / totalAtivos) * 100 : 0,
    }))
    .sort((a, b) => b.valor - a.valor);

  // Total dívidas
  const debts = await prisma.debt.findMany({
    where: ownerWhere,
    select: { valorRestante: true },
  });
  const totalDividas = debts.reduce((s, d) => s + toNum(d.valorRestante), 0);

  const patrimonioLiquido = totalAtivos - totalDividas;

  // Evolução 12 meses via snapshots
  const now = new Date();
  const start12m = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const assetIds = await prisma.asset.findMany({
    where: ownerWhere,
    select: { id: true },
  });
  const ids = assetIds.map((a) => a.id);

  const snapshots = ids.length > 0
    ? await prisma.assetSnapshot.findMany({
        where: {
          assetId: { in: ids },
          mesReferencia: { gte: start12m },
        },
        select: { mesReferencia: true, valor: true },
        orderBy: { mesReferencia: "asc" },
      })
    : [];

  // Aggregate snapshots by month
  const mesMap = new Map<string, number>();
  for (const s of snapshots) {
    const key = s.mesReferencia.toISOString().slice(0, 7);
    mesMap.set(key, (mesMap.get(key) ?? 0) + toNum(s.valor));
  }

  // Build 12 month evolution
  const evolucao12m: Array<{ mes: string; valor: number }> = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    evolucao12m.push({
      mes: label,
      valor: mesMap.get(key) ?? (i === 0 ? totalAtivos : 0),
    });
  }

  // Variação vs mês anterior
  const prevMonthVal = evolucao12m.length >= 2 ? evolucao12m[evolucao12m.length - 2].valor : 0;
  const variacao = patrimonioLiquido - prevMonthVal;
  const variacaoPct = prevMonthVal > 0 ? (variacao / prevMonthVal) * 100 : 0;

  return NextResponse.json({
    totalAtivos,
    totalDividas,
    patrimonioLiquido,
    variacao,
    variacaoPct,
    porTipo,
    evolucao12m,
  });
}
