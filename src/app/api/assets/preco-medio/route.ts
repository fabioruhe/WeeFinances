import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";

function toNum(v: unknown): number {
  if (v === null || v === undefined) return 0;
  return typeof v === "object" && "toNumber" in (v as object)
    ? (v as { toNumber(): number }).toNumber()
    : Number(v);
}

export async function GET() {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { user, coupleId, isCouple } = auth;
  const where = isCouple && coupleId
    ? { coupleId, ativo: true, ticker: { not: undefined } }
    : { userId: user.id, coupleId: null as string | null, ativo: true, ticker: { not: undefined } };

  const assets = await prisma.asset.findMany({
    where,
    orderBy: { ticker: "asc" },
  });

  // Agrupar por ticker
  const byTicker = new Map<string, typeof assets>();
  for (const a of assets) {
    if (!a.ticker) continue;
    const key = a.ticker.toUpperCase();
    if (!byTicker.has(key)) byTicker.set(key, []);
    byTicker.get(key)!.push(a);
  }

  const items = [...byTicker.entries()].map(([ticker, group]) => {
    const totalQuantidade = group.reduce((sum, a) => sum + toNum(a.quantidade), 0);
    const totalInvestido = group.reduce((sum, a) => sum + toNum(a.valorInvestido), 0);
    const totalAtual = group.reduce((sum, a) => sum + toNum(a.valorAtual), 0);
    const precoMedio = totalQuantidade > 0 ? totalInvestido / totalQuantidade : 0;
    const rentabilidade = totalAtual - totalInvestido;
    const rentabilidadePct = totalInvestido > 0 ? (rentabilidade / totalInvestido) * 100 : 0;
    const instituicoes = [...new Set(group.map((a) => a.instituicao).filter(Boolean) as string[])];

    return {
      ticker,
      tipo: group[0].tipo,
      instituicoes,
      totalQuantidade: Math.round(totalQuantidade * 1e6) / 1e6,
      totalInvestido: Math.round(totalInvestido * 100) / 100,
      precoMedio: Math.round(precoMedio * 100) / 100,
      totalAtual: Math.round(totalAtual * 100) / 100,
      rentabilidade: Math.round(rentabilidade * 100) / 100,
      rentabilidadePct: Math.round(rentabilidadePct * 100) / 100,
      compras: group.length,
    };
  });

  items.sort((a, b) => b.totalAtual - a.totalAtual);

  return NextResponse.json({ items });
}
