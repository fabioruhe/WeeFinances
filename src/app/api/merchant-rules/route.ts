import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";

const CreateRuleSchema = z.object({
  keyword: z.string().min(2).max(100),
  categoriaId: z.string().uuid(),
  subcategoriaId: z.string().uuid().nullable().optional(),
});

// ─── GET /api/merchant-rules ──────────────────────────────────────────────────

export async function GET(_req: NextRequest) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const { coupleId } = auth;

  const rules = await prisma.merchantRule.findMany({
    where: {
      OR: [
        ...(coupleId ? [{ coupleId }] : []),
        { coupleId: null },
      ],
    },
    orderBy: [{ source: "asc" }, { hitCount: "desc" }],
    select: {
      id: true,
      keyword: true,
      source: true,
      hitCount: true,
      coupleId: true,
      categoria: { select: { id: true, nome: true, icone: true } },
      subcategoria: { select: { id: true, nome: true } },
    },
  });

  return NextResponse.json({ rules });
}

// ─── POST /api/merchant-rules ─────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const { coupleId } = auth;

  const body = await req.json();
  const parsed = CreateRuleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { keyword, categoriaId, subcategoriaId } = parsed.data;

  const rule = await prisma.merchantRule.create({
    data: {
      coupleId,
      keyword: keyword.toLowerCase().trim(),
      categoriaId,
      subcategoriaId: subcategoriaId ?? null,
      source: "USUARIO",
    },
    select: {
      id: true,
      keyword: true,
      source: true,
      hitCount: true,
      coupleId: true,
      categoria: { select: { id: true, nome: true, icone: true } },
      subcategoria: { select: { id: true, nome: true } },
    },
  });

  console.log("[CAT] Regra criada pelo usuário:", { keyword, categoria: categoriaId });

  return NextResponse.json({ rule }, { status: 201 });
}
