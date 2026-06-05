import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";

const UpdatePlanSchema = z.object({
  plano: z.enum(["FREE", "PREMIUM"]),
});

// ─── PATCH /api/users/me/plan ────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { user } = auth;

  const body = await req.json().catch(() => ({}));
  const parsed = UpdatePlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { plano: parsed.data.plano },
    select: { id: true, plano: true },
  });

  return NextResponse.json({ ok: true, plano: updated.plano });
}
