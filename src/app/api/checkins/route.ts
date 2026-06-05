import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";
import { parseMesStr, mesReferenciaDate } from "@/lib/budget-utils";

// ─── GET /api/checkins?limit=10 ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { user, coupleId, isCouple } = auth;
  const limitParam = req.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Math.min(parseInt(limitParam, 10), 50) : 12;

  const where = isCouple && coupleId
    ? { coupleId }
    : { userId: user.id };

  const checkins = await prisma.checkIn.findMany({
    where,
    orderBy: { data: "desc" },
    take: limit,
  });

  const mapped = checkins.map((c) => ({
    id: c.id,
    data: c.data.toISOString().split("T")[0],
    sentimentoA: c.sentimentoA,
    sentimentoB: c.sentimentoB,
    resumoJson: c.resumoJson as Record<string, unknown> | null,
    createdAt: c.createdAt.toISOString(),
  }));

  return NextResponse.json({ checkins: mapped });
}

// ─── POST /api/checkins ─────────────────────────────────────────────────────

const AjusteSchema = z.object({
  categoriaId: z.string().uuid(),
  novoLimite: z.number().nonnegative(),
  mesReferencia: z.string().regex(/^\d{4}-\d{2}$/),
});

const CreateCheckinSchema = z.object({
  mes: z.string().regex(/^\d{4}-\d{2}$/),
  sentimentoA: z.number().int().min(1).max(5),
  sentimentoB: z.number().int().min(1).max(5).optional().nullable(),
  ajustes: z.array(AjusteSchema).optional(),
  resumoJson: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { user, coupleId, isCouple } = auth;

  const body = await req.json();
  const parsed = CreateCheckinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { mes, sentimentoA, sentimentoB, ajustes, resumoJson } = parsed.data;
  const { year, month } = parseMesStr(mes);
  const mesRef = mesReferenciaDate(year, month);

  // ── Verificar duplicata ──
  const existing = await prisma.checkIn.findFirst({
    where: {
      ...(isCouple && coupleId
        ? { coupleId }
        : { userId: user.id }),
      data: mesRef,
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Você já fez o check-in deste mês." },
      { status: 409 },
    );
  }

  // ── Budget adjustments ──
  if (ajustes && ajustes.length > 0) {
    const budgetOps = ajustes.map((ajuste) => {
      const { year: aYear, month: aMonth } = parseMesStr(ajuste.mesReferencia);
      const ajusteMesRef = mesReferenciaDate(aYear, aMonth);
      return prisma.budget.upsert({
        where: {
          userId_categoriaId_mesReferencia: {
            userId: user.id,
            categoriaId: ajuste.categoriaId,
            mesReferencia: ajusteMesRef,
          },
        },
        update: { limiteMensal: ajuste.novoLimite, coupleId: coupleId ?? null },
        create: {
          userId: user.id,
          coupleId: coupleId ?? null,
          categoriaId: ajuste.categoriaId,
          limiteMensal: ajuste.novoLimite,
          mesReferencia: ajusteMesRef,
        },
      });
    });
    await prisma.$transaction(budgetOps);
  }

  // ── Create check-in ──
  const checkin = await prisma.checkIn.create({
    data: {
      userId: user.id,
      coupleId: isCouple ? coupleId : null,
      data: mesRef,
      sentimentoA,
      sentimentoB: sentimentoB ?? null,
      resumoJson: resumoJson
        ? (resumoJson as Prisma.InputJsonValue)
        : undefined,
    },
  });

  return NextResponse.json(
    { checkin: { id: checkin.id } },
    { status: 201 },
  );
}
