import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";

// ─── GET /api/users/me ───────────────────────────────────────────────────────

export async function GET() {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { user } = auth;

  return NextResponse.json({
    id: user.id,
    nome: user.nome,
    email: user.email,
    image: user.image,
    plano: user.plano,
    onboardingCompleto: user.onboardingCompleto,
    perfilFinanceiro: user.perfilFinanceiro,
    coupleId: user.coupleId,
  });
}

// ─── PATCH /api/users/me ─────────────────────────────────────────────────────

const UpdateUserSchema = z.object({
  nome: z.string().min(2).max(100).optional(),
  image: z.string().url().nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { user } = auth;

  const body = await req.json().catch(() => ({}));
  const parsed = UpdateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: parsed.data,
    select: {
      id: true,
      nome: true,
      email: true,
      image: true,
      plano: true,
      onboardingCompleto: true,
      perfilFinanceiro: true,
      coupleId: true,
    },
  });

  return NextResponse.json(updated);
}
