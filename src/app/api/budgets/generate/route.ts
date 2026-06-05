import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";
import { getCategoriaGrupo, parseMesStr } from "@/lib/budget-utils";

const GenerateSchema = z.object({
  mesReferencia: z.string().regex(/^\d{4}-\d{2}$/),
});

// ─── POST /api/budgets/generate ───────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { user, coupleId } = auth;
  const body = await req.json();

  const parsed = GenerateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { year, month } = parseMesStr(parsed.data.mesReferencia);
  const mesStart = new Date(year, month - 1, 1);
  const mesEnd = new Date(year, month, 0, 23, 59, 59);

  // IDs dos membros do casal (ou só o usuário)
  let userIds = [user.id];
  if (coupleId) {
    const couple = await prisma.couple.findUnique({
      where: { id: coupleId },
      select: { userAId: true, userBId: true },
    });
    if (couple) {
      userIds = [couple.userAId, ...(couple.userBId ? [couple.userBId] : [])];
    }
  }

  // Renda total do casal no mês
  const rendaAgg = await prisma.income.aggregate({
    where: {
      userId: { in: userIds },
      mesReferencia: { gte: mesStart, lte: mesEnd },
    },
    _sum: { valor: true },
  });
  const rendaTotal = Number(rendaAgg._sum.valor ?? 0);

  if (rendaTotal === 0) {
    return NextResponse.json(
      { error: "no_income", message: "Nenhuma renda cadastrada para o mês selecionado." },
      { status: 400 }
    );
  }

  // Categorias disponíveis
  const categorias = await prisma.category.findMany({
    where: { OR: [{ coupleId: null }, ...(coupleId ? [{ coupleId }] : [])] },
    select: { id: true, nome: true, icone: true },
    orderBy: { nome: "asc" },
  });

  const groups = {
    NECESSIDADES: categorias.filter((c) => getCategoriaGrupo(c.nome) === "NECESSIDADES"),
    DESEJOS: categorias.filter((c) => getCategoriaGrupo(c.nome) === "DESEJOS"),
    FUTURO: categorias.filter((c) => getCategoriaGrupo(c.nome) === "FUTURO"),
  };

  const distribuir = (cats: typeof categorias, total: number) => {
    if (cats.length === 0) return [];
    const perCat = total / cats.length;
    return cats.map((c) => ({
      categoriaId: c.id,
      categoriaNome: c.nome,
      icone: c.icone,
      limiteSugerido: Math.round(perCat * 100) / 100,
      grupo: getCategoriaGrupo(c.nome),
    }));
  };

  const sugestoes = [
    ...distribuir(groups.NECESSIDADES, rendaTotal * 0.5),
    ...distribuir(groups.DESEJOS, rendaTotal * 0.3),
    ...distribuir(groups.FUTURO, rendaTotal * 0.2),
  ];

  const totalSugerido = sugestoes.reduce((acc, s) => acc + s.limiteSugerido, 0);

  return NextResponse.json({
    sugestoes,
    rendaTotal,
    totalSugerido: Math.round(totalSugerido * 100) / 100,
    distribuicao: {
      NECESSIDADES: Math.round(rendaTotal * 0.5 * 100) / 100,
      DESEJOS: Math.round(rendaTotal * 0.3 * 100) / 100,
      FUTURO: Math.round(rendaTotal * 0.2 * 100) / 100,
    },
  });
}
