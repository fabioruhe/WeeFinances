import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";

// ─── GET /api/transactions/review ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const { user, coupleId } = auth;

  // semana: ISO string do início da semana (ex: "2026-04-06")
  const semanaParam = req.nextUrl.searchParams.get("semana");

  let weekStart: Date;
  let weekEnd: Date;

  if (semanaParam) {
    weekStart = new Date(semanaParam);
    weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59);
  } else {
    // Semana atual
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Dom
    weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);
    weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59);
  }

  const where = {
    OR: [
      { userId: user.id },
      ...(coupleId ? [{ coupleId }] : []),
    ],
    reviewed: false,
    deletedAt: null,
    categoriaFonte: { in: ["SISTEMA" as const, "USUARIO" as const] },
    data: { gte: weekStart, lte: weekEnd },
  };

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { data: "desc" },
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
      categoria: { select: { id: true, nome: true, icone: true } },
      subcategoria: { select: { id: true, nome: true } },
    },
  });

  return NextResponse.json({
    transactions,
    total: transactions.length,
    semanaInicio: weekStart.toISOString(),
    semanaFim: weekEnd.toISOString(),
  });
}
