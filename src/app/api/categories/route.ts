import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";

// ─── GET /api/categories ─────────────────────────────────────────────────────

export async function GET() {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { coupleId } = auth;

  const categories = await prisma.category.findMany({
    where: {
      OR: [
        { tipo: "PADRAO" },
        ...(coupleId ? [{ tipo: "CUSTOM" as const, coupleId }] : []),
      ],
    },
    include: {
      subcategories: { orderBy: { ordem: "asc" } },
    },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(categories);
}

// ─── POST /api/categories ────────────────────────────────────────────────────

const CreateCategorySchema = z.object({
  nome: z.string().min(1).max(50),
  icone: z.string().max(30).optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { coupleId, isCouple } = auth;

  if (!isCouple || !coupleId) {
    return NextResponse.json(
      { error: "couple_required", message: "Categorias customizadas requerem modo casal." },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = CreateCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const category = await prisma.category.create({
    data: {
      nome: parsed.data.nome,
      icone: parsed.data.icone ?? null,
      tipo: "CUSTOM",
      coupleId,
    },
  });

  return NextResponse.json(category, { status: 201 });
}
