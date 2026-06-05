import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";

const UpdateRuleSchema = z.object({
  categoriaId: z.string().uuid().optional(),
  subcategoriaId: z.string().uuid().nullable().optional(),
});

// ─── PUT /api/merchant-rules/:id ──────────────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const { coupleId } = auth;

  const { id } = await params;

  const rule = await prisma.merchantRule.findFirst({
    where: { id, coupleId },
  });

  if (!rule) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = UpdateRuleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const updated = await prisma.merchantRule.update({
    where: { id },
    data: parsed.data,
    select: {
      id: true,
      keyword: true,
      source: true,
      hitCount: true,
      categoria: { select: { id: true, nome: true, icone: true } },
      subcategoria: { select: { id: true, nome: true } },
    },
  });

  return NextResponse.json({ rule: updated });
}

// ─── DELETE /api/merchant-rules/:id ──────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const { coupleId } = auth;

  const { id } = await params;

  const rule = await prisma.merchantRule.findFirst({
    where: { id, coupleId },
  });

  if (!rule) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.merchantRule.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
