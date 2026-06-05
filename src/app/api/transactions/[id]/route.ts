import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";
import { matchMerchantRule, extractKeyword } from "@/lib/categorization";

// ─── Schema ───────────────────────────────────────────────────────────────────

const UpdateTransactionSchema = z.object({
  valor: z.number().positive().optional(),
  tipo: z.enum(["RECEITA", "DESPESA"]).optional(),
  escopo: z.enum(["INDIVIDUAL", "COMPARTILHADA"]).optional(),
  categoriaId: z.string().uuid().nullable().optional(),
  subcategoriaId: z.string().uuid().nullable().optional(),
  descricao: z.string().min(2).max(200).optional(),
  data: z
    .string()
    .refine((d) => {
      const date = new Date(d);
      return !isNaN(date.getTime()) && date <= new Date();
    }, "Data inválida ou futura")
    .optional(),
  reviewed: z.boolean().optional(),
});

// ─── GET /api/transactions/:id ────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const { user } = auth;

  const { id } = await params;

  const tx = await prisma.transaction.findFirst({
    where: { id, userId: user.id, deletedAt: null },
    include: {
      categoria: { select: { id: true, nome: true, icone: true } },
      subcategoria: { select: { id: true, nome: true, icone: true } },
    },
  });

  if (!tx) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(tx);
}

// ─── PUT /api/transactions/:id ────────────────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const { user, coupleId } = auth;

  const { id } = await params;

  const existing = await prisma.transaction.findFirst({
    where: { id, userId: user.id, deletedAt: null },
  });

  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = UpdateTransactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { categoriaId, subcategoriaId, descricao, data: dataStr, ...rest } =
    parsed.data;

  // Detectar mudança de categoria para sugerir MerchantRule
  let sugestaoRegra = false;
  let categoriaFonte = existing.categoriaFonte;

  const categoriaChanged =
    categoriaId !== undefined && categoriaId !== existing.categoriaId;

  if (categoriaChanged && categoriaId) {
    const descricaoFinal = descricao ?? existing.descricao ?? "";
    const matchExisting = await matchMerchantRule(descricaoFinal, coupleId);

    if (!matchExisting) {
      const keyword = extractKeyword(descricaoFinal);
      if (keyword) {
        sugestaoRegra = true;
      }
      categoriaFonte = "MANUAL";
    } else {
      // Usuário corrigiu sugestão → criar regra personalizada
      const oldCategoria = existing.categoriaId;
      if (matchExisting.categoriaId !== categoriaId) {
        console.log("[CAT] Correção de sugestão:", {
          de: oldCategoria,
          para: categoriaId,
        });
        const keyword = extractKeyword(descricaoFinal);
        if (keyword) {
          await prisma.merchantRule.upsert({
            where: {
              id: `user-rule-${user.id}-${keyword.replace(/\s/g, "-")}`,
            },
            update: {
              categoriaId,
              subcategoriaId: subcategoriaId ?? null,
              hitCount: { increment: 1 },
            },
            create: {
              id: `user-rule-${user.id}-${keyword.replace(/\s/g, "-")}`,
              coupleId,
              keyword,
              categoriaId,
              subcategoriaId: subcategoriaId ?? null,
              source: "USUARIO",
            },
          });
        }
        categoriaFonte = "USUARIO";
      }
    }
  }

  const updated = await prisma.transaction.update({
    where: { id },
    data: {
      ...rest,
      ...(categoriaId !== undefined ? { categoriaId } : {}),
      ...(subcategoriaId !== undefined ? { subcategoriaId } : {}),
      ...(descricao !== undefined ? { descricao } : {}),
      ...(dataStr !== undefined ? { data: new Date(dataStr) } : {}),
      categoriaFonte,
    },
    include: {
      categoria: { select: { id: true, nome: true, icone: true } },
      subcategoria: { select: { id: true, nome: true, icone: true } },
    },
  });

  return NextResponse.json({ transaction: updated, sugestao_regra: sugestaoRegra });
}

// ─── DELETE /api/transactions/:id ─────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const { user } = auth;

  const { id } = await params;

  const existing = await prisma.transaction.findFirst({
    where: { id, userId: user.id, deletedAt: null },
  });

  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.transaction.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
