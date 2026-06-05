import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";

const ConfirmSchema = z.object({
  transaction_ids: z.array(z.string().uuid()).min(1),
  correcoes: z
    .array(
      z.object({
        id: z.string().uuid(),
        categoriaId: z.string().uuid(),
        subcategoriaId: z.string().uuid().nullable().optional(),
      })
    )
    .optional(),
});

// ─── POST /api/transactions/review/confirm ────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const { user } = auth;

  const body = await req.json();
  const parsed = ConfirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { transaction_ids, correcoes } = parsed.data;

  // Verificar ownership
  const owned = await prisma.transaction.findMany({
    where: {
      id: { in: transaction_ids },
      userId: user.id,
      deletedAt: null,
    },
    select: { id: true },
  });

  const ownedIds = new Set(owned.map((t) => t.id));
  const validIds = transaction_ids.filter((id) => ownedIds.has(id));

  // Aplicar correções
  if (correcoes?.length) {
    for (const correcao of correcoes) {
      if (ownedIds.has(correcao.id)) {
        await prisma.transaction.update({
          where: { id: correcao.id },
          data: {
            categoriaId: correcao.categoriaId,
            subcategoriaId: correcao.subcategoriaId ?? null,
            categoriaFonte: "MANUAL",
            reviewed: true,
          },
        });
      }
    }
  }

  // IDs sem correção: apenas marcar como reviewed
  const correcaoIds = new Set(correcoes?.map((c) => c.id) ?? []);
  const onlyConfirmIds = validIds.filter((id) => !correcaoIds.has(id));

  if (onlyConfirmIds.length) {
    await prisma.transaction.updateMany({
      where: { id: { in: onlyConfirmIds } },
      data: { reviewed: true },
    });
  }

  console.log("[REVISAO] Batch confirmado:", {
    count: validIds.length,
    correcoes: correcoes?.length ?? 0,
  });

  return NextResponse.json({ ok: true, confirmed: validIds.length });
}
