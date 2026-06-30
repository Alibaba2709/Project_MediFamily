"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { FamilyMember } from "@/app/lib/family";
import { AddFamilyMemberForm } from "@/app/components/AddFamilyMemberForm";
import { ProfileImageControl } from "@/app/components/ProfileImageControl";
import { MemberHealthInfoForm } from "@/app/components/MemberHealthInfoForm";
import type { FamilyPlanSummary } from "@/app/lib/plans";
import { PREMIUM_MEMBER_LIMIT } from "@/app/lib/plans";

type FamilyMembersManagerProps = {
  currentUserName: string;
  members: FamilyMember[];
  plan: FamilyPlanSummary;
};

export function FamilyMembersManager({
  currentUserName,
  members,
  plan,
}: FamilyMembersManagerProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const memberCount = members.length;
  const isAtLimit = memberCount >= plan.memberLimit;

  async function removeMember(name: string) {
    setError("");
    const response = await fetch(
      `/api/family/members/${encodeURIComponent(name)}`,
      { method: "DELETE" }
    );
    const result = await response.json();

    if (!response.ok) {
      setError(result.error ?? "Non sono riuscita a rimuovere il membro.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase text-[#7a6f68]">
            Membri famiglia
          </h2>
          <p className="mt-1 text-sm text-[#6c5f57]">
            {memberCount}/{plan.memberLimit} membri inclusi nel piano {plan.name}
          </p>
        </div>
        {isAtLimit ? (
          <span className="rounded-md bg-[#fff7f5] px-2 py-1 text-xs font-semibold text-[#9f4d46]">
            {plan.isPremiumActive ? "Limite" : "Upgrade"}
          </span>
        ) : null}
      </div>

      <div className="space-y-2">
        {members.map((member) => (
          <div
            className="flex flex-col gap-3 rounded-md bg-[#fffaf6] p-2 sm:flex-row sm:items-center sm:justify-between"
            key={member.name}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-3">
                  <ProfileImageControl
                    avatarClassName="size-9"
                    compact
                    hasImage={Boolean(member.imageDataUrl)}
                    imageDataUrl={member.imageDataUrl}
                    memberName={member.name}
                    mode="avatar"
                    name={member.name}
                    tone={member.tone}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-[#29302d]">
                      {member.name}
                    </span>
                    <span className="block truncate text-xs text-[#7a6f68]">
                      {member.role}
                    </span>
                  </span>
                </span>
                <button
                  aria-label={`Rimuovi ${member.name}`}
                  className="flex size-8 shrink-0 items-center justify-center rounded-md text-[#9f4d46] transition hover:bg-[#fdece8] disabled:cursor-not-allowed disabled:opacity-35"
                  disabled={member.name === currentUserName}
                  onClick={() => removeMember(member.name)}
                  type="button"
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
              <details className="mt-3 rounded-md border border-[#eadfd7] bg-white p-3">
                <summary className="cursor-pointer text-sm font-semibold text-[#315a45]">
                  Scheda sanitaria
                </summary>
                <div className="mt-3">
                  <MemberHealthInfoForm member={member} />
                </div>
              </details>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-[#eee5dd] pt-4">
        {error ? (
          <p className="rounded-md bg-[#fff7f5] px-3 py-2 text-sm font-medium text-[#9f4d46]">
            {error}
          </p>
        ) : null}

        {isAtLimit ? (
          <p className="rounded-md border border-[#f1d8cf] bg-[#fff7f5] px-3 py-2 text-sm text-[#7f5146]">
            {plan.isPremiumActive
              ? `Hai raggiunto il limite Premium di ${plan.memberLimit} membri.`
              : `Hai raggiunto il limite gratuito. Il Premium porta il nucleo a ${PREMIUM_MEMBER_LIMIT} membri.`}
          </p>
        ) : null}
        {!isAtLimit ? (
          <AddFamilyMemberForm
            currentCount={memberCount}
            limit={plan.memberLimit}
            planName={plan.name}
            premiumLimit={PREMIUM_MEMBER_LIMIT}
          />
        ) : null}
      </div>
    </div>
  );
}
