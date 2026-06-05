import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = ForgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const token = randomUUID();
    const expires = new Date(Date.now() + 3600_000); // 1 hour

    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    await prisma.verificationToken.create({
      data: { identifier: email, token, expires },
    });

    // No email service yet — log the reset link
    console.log(
      `[RESET] http://localhost:3000/auth/reset-password?token=${token}`
    );
  }

  // Always return 200 to prevent email enumeration
  return NextResponse.json({
    ok: true,
    message: "Se o email existir, um link de redefinicao foi enviado.",
  });
}
