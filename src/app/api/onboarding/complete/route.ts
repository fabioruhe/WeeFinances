import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";

export async function POST() {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  await prisma.user.update({
    where: { id: auth.user.id },
    data: { onboardingCompleto: true },
  });

  return NextResponse.json({ ok: true });
}
