import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";

// ─── PATCH /api/subcategories/:id ────────────────────────────────────────────

const UpdateSubcategorySchema = z.object({
  nome: z.string().min(1).max(50).optional(),
  icone: z.string().max(30).optional(),
  ordem: z.number().int().nonnegative().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { coupleId } = auth;
  const { id } = await params;

  const subcategory = await prisma.subcategory.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!subcategory) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (subcategory.category.tipo !== "CUSTOM" || subcategory.category.coupleId !== coupleId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = UpdateSubcategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const updated = await prisma.subcategory.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}

// ─── DELETE /api/subcategories/:id ───────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { coupleId } = auth;
  const { id } = await params;

  const subcategory = await prisma.subcategory.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!subcategory) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (subcategory.category.tipo !== "CUSTOM" || subcategory.category.coupleId !== coupleId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const txCount = await prisma.transaction.count({
    where: { subcategoriaId: id, deletedAt: null },
  });

  if (txCount > 0) {
    return NextResponse.json(
      { error: "subcategory_has_transactions", message: `Subcategoria possui ${txCount} transacao(oes) vinculada(s).` },
      { status: 409 }
    );
  }

  await prisma.subcategory.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
