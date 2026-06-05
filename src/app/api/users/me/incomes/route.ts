import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";

// ─── GET /api/users/me/incomes ───────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { user } = auth;

  const mes = req.nextUrl.searchParams.get("mes"); // format: "2026-04"
  let dateFilter = {};

  if (mes) {
    const [year, month] = mes.split("-").map(Number);
    if (year && month) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      dateFilter = { mesReferencia: { gte: start, lte: end } };
    }
  }

  const incomes = await prisma.income.findMany({
    where: { userId: user.id, ...dateFilter },
    orderBy: { mesReferencia: "desc" },
  });

  const total = incomes.reduce(
    (sum, inc) => sum + Number(inc.valor),
    0
  );

  return NextResponse.json({ incomes, total });
}

// ─── POST /api/users/me/incomes ──────────────────────────────────────────────

const CreateIncomeSchema = z.object({
  valor: z.number().positive(),
  tipo: z.enum(["FIXO", "VARIAVEL", "EXTRAORDINARIO"]),
  descricao: z.string().max(200).optional(),
  mesReferencia: z.string().refine((d) => {
    const date = new Date(d);
    return !isNaN(date.getTime());
  }, "Data invalida"),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { user } = auth;

  const body = await req.json().catch(() => ({}));
  const parsed = CreateIncomeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const mesRef = new Date(parsed.data.mesReferencia);
  // Normalize to first of month
  const mesReferencia = new Date(mesRef.getFullYear(), mesRef.getMonth(), 1);

  const income = await prisma.income.create({
    data: {
      userId: user.id,
      valor: parsed.data.valor,
      tipo: parsed.data.tipo,
      descricao: parsed.data.descricao ?? null,
      mesReferencia,
    },
  });

  return NextResponse.json(income, { status: 201 });
}
