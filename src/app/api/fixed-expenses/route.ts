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

const CreateSchema = z.object({
  nome: z.string().min(2).max(100),
  valor_medio: z.number().min(0),
  categoria_id: z.string(),
  prioridade: z.number().int().min(0).optional(),
});

const ReorderSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    prioridade: z.number().int().min(0),
  })),
});

// ─── GET /api/fixed-expenses ─────────────────────────────────────────────────

export async function GET() {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { user, coupleId, isCouple } = auth;
  const ownerWhere = isCouple && coupleId
    ? { coupleId }
    : { userId: user.id, coupleId: null };

  const expenses = await prisma.fixedExpense.findMany({
    where: { ...ownerWhere, ativo: true },
    include: { categoria: { select: { nome: true } } },
    orderBy: { prioridade: "asc" },
  });

  return NextResponse.json({
    expenses: expenses.map((e) => ({
      id: e.id,
      nome: e.nome,
      valorMedio: toNum(e.valorMedio),
      categoriaNome: e.categoria?.nome ?? null,
      prioridade: e.prioridade,
    })),
  });
}

// ─── POST /api/fixed-expenses ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { user, coupleId, isCouple } = auth;
  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { nome, valor_medio, categoria_id, prioridade } = parsed.data;

  // Default prioridade: max + 1
  let prio = prioridade ?? 0;
  if (prioridade === undefined) {
    const ownerWhere = isCouple && coupleId
      ? { coupleId }
      : { userId: user.id, coupleId: null };
    const maxExp = await prisma.fixedExpense.findFirst({
      where: { ...ownerWhere, ativo: true },
      orderBy: { prioridade: "desc" },
      select: { prioridade: true },
    });
    prio = (maxExp?.prioridade ?? 0) + 1;
  }

  const expense = await prisma.fixedExpense.create({
    data: {
      userId: user.id,
      coupleId: isCouple ? coupleId : null,
      nome,
      valorMedio: valor_medio,
      categoriaId: categoria_id,
      prioridade: prio,
    },
    include: { categoria: { select: { nome: true } } },
  });

  return NextResponse.json({
    expense: {
      id: expense.id,
      nome: expense.nome,
      valorMedio: toNum(expense.valorMedio),
      categoriaNome: expense.categoria?.nome ?? null,
      prioridade: expense.prioridade,
    },
  }, { status: 201 });
}

// ─── PUT /api/fixed-expenses (reorder) ───────────────────────────────────────

export async function PUT(req: NextRequest) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = ReorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  await prisma.$transaction(
    parsed.data.items.map((item) =>
      prisma.fixedExpense.update({
        where: { id: item.id },
        data: { prioridade: item.prioridade },
      }),
    ),
  );

  return NextResponse.json({ ok: true });
}
