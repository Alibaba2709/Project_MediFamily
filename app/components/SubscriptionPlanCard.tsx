import { Crown, LockKeyhole, Sparkles, Users } from "lucide-react";
import type { FamilyPlanSummary } from "@/app/lib/plans";
import {
  FREE_MEMBER_LIMIT,
  PREMIUM_MEMBER_LIMIT,
  PREMIUM_MONTHLY_PRICE_LABEL,
} from "@/app/lib/plans";

type SubscriptionPlanCardProps = {
  memberCount: number;
  plan: FamilyPlanSummary;
};

export function SubscriptionPlanCard({
  memberCount,
  plan,
}: SubscriptionPlanCardProps) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase text-[#7a6f68]">
            Piano famiglia
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#6c5f57]">
            Gestisci limiti del nucleo e upgrade futuri.
          </p>
        </div>
        <span className="rounded-md bg-[#f6fbf7] px-2 py-1 text-xs font-semibold text-[#315a45]">
          {plan.name}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div
          className={`rounded-lg border p-4 ${
            plan.isPremiumActive
              ? "border-[#eadfd7] bg-[#fffdfb]"
              : "border-[#d5e0d8] bg-[#f6fbf7]"
          }`}
        >
          <div className="flex items-center gap-2">
            <Users size={18} className="text-[#315a45]" aria-hidden="true" />
            <h3 className="font-semibold text-[#29302d]">Free</h3>
          </div>
          <p className="mt-2 text-2xl font-semibold text-[#29302d]">0 EUR</p>
          <p className="mt-1 text-sm text-[#6c5f57]">
            Fino a {FREE_MEMBER_LIMIT} membri del nucleo.
          </p>
        </div>

        <div
          className={`rounded-lg border p-4 ${
            plan.isPremiumActive
              ? "border-[#d5e0d8] bg-[#f6fbf7]"
              : "border-[#f0d3a6] bg-[#fff8e9]"
          }`}
        >
          <div className="flex items-center gap-2">
            <Crown size={18} className="text-[#7a5b2f]" aria-hidden="true" />
            <h3 className="font-semibold text-[#29302d]">Premium</h3>
          </div>
          <p className="mt-2 text-2xl font-semibold text-[#29302d]">
            {PREMIUM_MONTHLY_PRICE_LABEL}
          </p>
          <p className="mt-1 text-sm text-[#6c5f57]">
            Fino a {PREMIUM_MEMBER_LIMIT} membri e feature future incluse.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-[#eadfd7] bg-[#fffaf6] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#29302d]">
              Uso attuale: {memberCount}/{plan.memberLimit} membri
            </p>
            <p className="mt-1 text-sm leading-6 text-[#6c5f57]">
              {plan.isPremiumActive
                ? "Il piano Premium e attivo per questo nucleo."
                : "Il pagamento non e ancora attivo: prima va configurata la parte fiscale e Stripe."}
            </p>
          </div>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#315a45] px-4 text-sm font-semibold text-white opacity-70"
            disabled
            type="button"
          >
            {plan.isPremiumActive ? (
              <>
                <Sparkles size={16} aria-hidden="true" />
                Premium attivo
              </>
            ) : (
              <>
                <LockKeyhole size={16} aria-hidden="true" />
                Upgrade in preparazione
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
