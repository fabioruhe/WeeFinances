import { type UserPlan } from "@prisma/client";
import { NextResponse } from "next/server";

import { hasFeatureAccess, type PremiumFeature } from "@/lib/premium";

export type PlanGuardResult = { ok: true } | { ok: false; response: NextResponse };

export function requireFeaturePlan(plano: UserPlan, feature: PremiumFeature): PlanGuardResult {
  if (hasFeatureAccess(plano, feature)) return { ok: true };

  return {
    ok: false,
    response: NextResponse.json(
      {
        error: "feature_requires_premium",
        message:
          "Este recurso faz parte do Wee Finances Premium. Veja o preview e faça upgrade para liberar.",
        feature,
      },
      { status: 402 },
    ),
  };
}
