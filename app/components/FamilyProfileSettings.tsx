"use client";

import { useMemo, useState } from "react";
import { ProfileImageControl } from "@/app/components/ProfileImageControl";
import { MemberHealthInfoForm } from "@/app/components/MemberHealthInfoForm";
import type { FamilyMember } from "@/app/lib/family";

type FamilyProfileSettingsProps = {
  accountEmail: string;
  accountRole: string;
  currentUserName: string;
  members: FamilyMember[];
};

export function FamilyProfileSettings({
  accountEmail,
  accountRole,
  currentUserName,
  members,
}: FamilyProfileSettingsProps) {
  const preferredMember =
    members.find(
      (member) => member.name.toLowerCase() === currentUserName.toLowerCase()
    ) ?? members[0];
  const [selectedName, setSelectedName] = useState(preferredMember?.name ?? "");

  const selectedMember = useMemo(
    () =>
      members.find((member) => member.name === selectedName) ??
      preferredMember ??
      members[0],
    [members, preferredMember, selectedName]
  );

  if (!selectedMember) {
    return (
      <div>
        <h2 className="text-sm font-semibold uppercase text-[#7a6f68]">
          Profilo
        </h2>
        <p className="mt-3 text-sm text-[#6c5f57]">
          Aggiungi un membro del nucleo per compilare la sua scheda.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold uppercase text-[#7a6f68]">
          Profilo familiare
        </h2>
        <p className="mt-1 text-sm text-[#6c5f57]">
          Scegli un membro del nucleo e aggiorna foto e informazioni sanitarie.
        </p>
      </div>

      <label className="block space-y-2">
        <span className="text-xs font-semibold uppercase text-[#7a6f68]">
          Familiare
        </span>
        <select
          className="h-11 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm font-semibold text-[#29302d] outline-none focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
          value={selectedMember.name}
          onChange={(event) => setSelectedName(event.target.value)}
        >
          {members.map((member) => (
            <option key={member.name} value={member.name}>
              {member.name} - {member.role}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-4 rounded-lg border border-[#eadfd7] bg-[#fffaf6] p-4 sm:flex-row sm:items-start">
        <ProfileImageControl
          avatarClassName="size-16"
          avatarTextClassName="text-xl"
          hasImage={Boolean(selectedMember.imageDataUrl)}
          imageDataUrl={selectedMember.imageDataUrl}
          memberName={selectedMember.name}
          mode="avatar"
          name={selectedMember.name}
          tone={selectedMember.tone}
        />
        <div className="min-w-0 space-y-2 text-sm">
          <p>
            <span className="font-semibold text-[#29302d]">Nome:</span>{" "}
            <span className="text-[#6c5f57]">{selectedMember.name}</span>
          </p>
          <p>
            <span className="font-semibold text-[#29302d]">Ruolo nucleo:</span>{" "}
            <span className="text-[#6c5f57]">{selectedMember.role}</span>
          </p>
          {selectedMember.name.toLowerCase() ===
          currentUserName.toLowerCase() ? (
            <>
              <p>
                <span className="font-semibold text-[#29302d]">Email:</span>{" "}
                <span className="break-all text-[#6c5f57]">{accountEmail}</span>
              </p>
              <p>
                <span className="font-semibold text-[#29302d]">
                  Ruolo account:
                </span>{" "}
                <span className="text-[#6c5f57]">{accountRole}</span>
              </p>
            </>
          ) : null}
        </div>
      </div>

      <div className="border-t border-[#eee5dd] pt-4">
        <h3 className="text-sm font-semibold uppercase text-[#7a6f68]">
          Scheda sanitaria
        </h3>
        <div className="mt-3">
          <MemberHealthInfoForm
            key={selectedMember.name}
            member={selectedMember}
          />
        </div>
      </div>
    </div>
  );
}
