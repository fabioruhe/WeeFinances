import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";

function toNum(v: unknown): number {
  if (v === null || v === undefined) return 0;
  return typeof v === "object" && "toNumber" in (v as object)
    ? (v as { toNumber(): number }).toNumber()
    : Number(v);
}

// ─── GET /api/dividends/summary ──────────────────────────────────────────────

export async function GET() {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { user, coupleId, isCouple } = auth;
  const ownerWhere = isCouple && coupleId
    ? { coupleId }
    : { userId: user.id, coupleId: null };

  const now = new Date();
  const mesAtualStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const mesAtualEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const start12m = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  // Current month total
  const mesAtualEntries = await prisma.dividendEntry.findMany({
    where: {
      ...ownerWhere,
      mesReferencia: { gte: mesAtualStart, lt: mesAtualEnd },
    },
    select: { valor: true },
  });
  const mesAtual = mesAtualEntries.reduce((s, d) => s + toNum(d.valor), 0);

  // Last 12 months entries for evolution + average
  const entries12m = await prisma.dividendEntry.findMany({
    where: {
      ...ownerWhere,
      mesReferencia: { gte: start12m },
    },
    select: { valor: true, tipo: true, mesReferencia: true },
    orderBy: { mesReferencia: "asc" },
  });

  // Build 12-month evolution
  const mesMap = new Map<string, { total: number; porTipo: Record<string, number> }>();
  for (const e of entries12m) {
    const key = e.mesReferencia.toISOString().slice(0, 7);
    if (!mesMap.has(key)) mesMap.set(key, { total: 0, porTipo: {} });
    const entry = mesMap.get(key)!;
    const v = toNum(e.valor);
    entry.total += v;
    entry.porTipo[e.tipo] = (entry.porTipo[e.tipo] ?? 0) + v;
  }

  const evolucao12m: Array<{ mes: string; total: number; porTipo: Record<string, number> }> = [];
  let soma12m = 0;
  let mesesComDados = 0;

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    const data = mesMap.get(key);
    const total = data?.total ?? 0;
    if (total > 0) {
      soma12m += total;
      mesesComDados++;
    }
    evolucao12m.push({
      mes: label,
      total,
      porTipo: data?.porTipo ?? {},
    });
  }

  const media12Meses = mesesComDados > 0 ? soma12m / mesesComDados : 0;
  const projecaoAnual = media12Meses * 12;

  return NextResponse.json({
    mesAtual,
    media12Meses,
    projecaoAnual,
    evolucao12m,
  });
}
