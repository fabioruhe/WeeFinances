import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

// ─── POST /api/auth/reset-password ───────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = ResetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { token, password } = parsed.data;

  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!record || record.expires < new Date()) {
    return NextResponse.json(
      { error: "invalid_or_expired_token" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: record.identifier },
  });

  if (!user) {
    return NextResponse.json(
      { error: "invalid_or_expired_token" },
      { status: 400 }
    );
  }

  const senhaHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { senhaHash },
    }),
    prisma.verificationToken.delete({
      where: { identifier_token: { identifier: record.identifier, token } },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
