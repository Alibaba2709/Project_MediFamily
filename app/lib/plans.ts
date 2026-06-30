export type FamilyPlanKey = "free" | "premium";

export type FamilySubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "none";

export type FamilyPlanSummary = {
  key: FamilyPlanKey;
  name: string;
  memberLimit: number;
  monthlyPriceLabel: string;
  status: FamilySubscriptionStatus;
  isPremiumActive: boolean;
};

export const FREE_MEMBER_LIMIT = 6;
export const PREMIUM_MEMBER_LIMIT = 12;
export const PREMIUM_MONTHLY_PRICE_LABEL = "1,99 EUR/mese";

export function normalizeFamilyPlan(value?: string): FamilyPlanKey {
  return value === "premium" ? "premium" : "free";
}

export function normalizeSubscriptionStatus(
  value?: string
): FamilySubscriptionStatus {
  const allowed: FamilySubscriptionStatus[] = [
    "active",
    "trialing",
    "past_due",
    "canceled",
    "incomplete",
    "none",
  ];

  return allowed.includes(value as FamilySubscriptionStatus)
    ? (value as FamilySubscriptionStatus)
    : "none";
}

export function isPremiumSubscriptionActive(
  plan: FamilyPlanKey,
  status: FamilySubscriptionStatus
) {
  return plan === "premium" && ["active", "trialing"].includes(status);
}

export function buildFamilyPlanSummary(
  planValue?: string,
  statusValue?: string
): FamilyPlanSummary {
  const key = normalizeFamilyPlan(planValue);
  const status = normalizeSubscriptionStatus(statusValue);
  const isPremiumActive = isPremiumSubscriptionActive(key, status);

  return {
    key: isPremiumActive ? "premium" : "free",
    name: isPremiumActive ? "Premium" : "Free",
    memberLimit: isPremiumActive ? PREMIUM_MEMBER_LIMIT : FREE_MEMBER_LIMIT,
    monthlyPriceLabel: isPremiumActive ? PREMIUM_MONTHLY_PRICE_LABEL : "0 EUR",
    status,
    isPremiumActive,
  };
}
