import type { UserPlan } from "@prisma/client";

export const PREMIUM_FEATURES = {
  ADVANCED_REPORTS: "advanced-reports",
  SUBSCRIPTION_DETECTOR: "subscription-detector",
  OPEN_FINANCE: "open-finance",
  MULTI_CARD_SIMULATOR: "multi-card-simulator",
  UNLIMITED_CARDS: "unlimited-cards",
} as const;

export type PremiumFeature = (typeof PREMIUM_FEATURES)[keyof typeof PREMIUM_FEATURES];

export function hasFeatureAccess(plano: UserPlan, feature: PremiumFeature): boolean {
  if (plano === "PREMIUM") return true;
  const freeFeatures: PremiumFeature[] = [];
  return freeFeatures.includes(feature);
}
