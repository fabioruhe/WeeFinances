import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";

// ─── GET /api/subcategories?categoriaId=X ────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { coupleId } = auth;

  const categoriaId = req.nextUrl.searchParams.get("categoriaId");
  if (!categoriaId) {
    return NextResponse.json(
      { error: "missing_param", message: "categoriaId e obrigatorio." },
      { status: 400 }
    );
  }

  // Verify access to the parent category
  const category = await prisma.category.findUnique({
    where: { id: categoriaId },
  });

  if (!category) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (category.tipo === "CUSTOM" && category.coupleId !== coupleId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const subcategories = await prisma.subcategory.findMany({
    where: { categoriaId },
    orderBy: { ordem: "asc" },
  });

  return NextResponse.json(subcategories);
}

// ─── POST /api/subcategories ─────────────────────────────────────────────────

const CreateSubcategorySchema = z.object({
  categoriaId: z.string().uuid(),
  nome: z.string().min(1).max(50),
  icone: z.string().max(30).optional(),
  ordem: z.number().int().nonnegative().optional().default(0),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { coupleId } = auth;

  const body = await req.json().catch(() => ({}));
  const parsed = CreateSubcategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  // Verify parent category is CUSTOM and belongs to user's couple
  const category = await prisma.category.findUnique({
    where: { id: parsed.data.categoriaId },
  });

  if (!category) {
    return NextResponse.json(
      { error: "category_not_found" },
      { status: 404 }
    );
  }

  if (category.tipo !== "CUSTOM" || category.coupleId !== coupleId) {
    return NextResponse.json(
      { error: "forbidden", message: "Subcategorias so podem ser adicionadas a categorias customizadas." },
      { status: 403 }
    );
  }

  const subcategory = await prisma.subcategory.create({
    data: {
      categoriaId: parsed.data.categoriaId,
      nome: parsed.data.nome,
      icone: parsed.data.icone ?? null,
      ordem: parsed.data.ordem,
    },
  });

  return NextResponse.json(subcategory, { status: 201 });
}
