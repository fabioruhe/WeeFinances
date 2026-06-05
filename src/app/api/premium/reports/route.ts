import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { requireFeaturePlan } from "@/lib/guards/require-plan";
import { PREMIUM_FEATURES } from "@/lib/premium";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plano: true },
  });

  if (!user) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  const guard = requireFeaturePlan(user.plano, PREMIUM_FEATURES.ADVANCED_REPORTS);
  if (!guard.ok) return guard.response;

  return NextResponse.json({
    period: "12m",
    yearlyComparison: true,
    projection: true,
    exportFormats: ["csv", "xlsx"],
  });
}
