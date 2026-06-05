import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";

// ─── PATCH /api/categories/:id ───────────────────────────────────────────────

const UpdateCategorySchema = z.object({
  nome: z.string().min(1).max(50).optional(),
  icone: z.string().max(30).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { coupleId } = auth;
  const { id } = await params;

  const category = await prisma.category.findUnique({ where: { id } });

  if (!category) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (category.tipo === "PADRAO") {
    return NextResponse.json(
      { error: "forbidden", message: "Categorias padrao nao podem ser editadas." },
      { status: 403 }
    );
  }

  if (category.coupleId !== coupleId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = UpdateCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const updated = await prisma.category.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}

// ─── DELETE /api/categories/:id ──────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { coupleId } = auth;
  const { id } = await params;

  const category = await prisma.category.findUnique({ where: { id } });

  if (!category) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (category.tipo === "PADRAO") {
    return NextResponse.json(
      { error: "forbidden", message: "Categorias padrao nao podem ser excluidas." },
      { status: 403 }
    );
  }

  if (category.coupleId !== coupleId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const txCount = await prisma.transaction.count({
    where: { categoriaId: id, deletedAt: null },
  });

  if (txCount > 0) {
    return NextResponse.json(
      { error: "category_has_transactions", message: `Categoria possui ${txCount} transacao(oes) vinculada(s).` },
      { status: 409 }
    );
  }

  await prisma.category.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
