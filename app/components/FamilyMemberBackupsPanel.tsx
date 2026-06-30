"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RotateCcw, ShieldCheck } from "lucide-react";
import type { FamilyMemberBackupView } from "@/app/lib/familyMemberBackups";

type FamilyMemberBackupsPanelProps = {
  backups: FamilyMemberBackupView[];
};

const reasonLabels: Record<FamilyMemberBackupView["reason"], string> = {
  add: "Prima di aggiungere",
  delete: "Prima di rimuovere",
  "invite-accept": "Prima di accettare invito",
  restore: "Prima di ripristinare",
  update: "Prima di modificare",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function FamilyMemberBackupsPanel({
  backups,
}: FamilyMemberBackupsPanelProps) {
  const router = useRouter();
  const [restoringId, setRestoringId] = useState("");
  const [message, setMessage] = useState("");

  async function restoreBackup(backupId: string) {
    const confirmed = window.confirm(
      "Ripristino questo backup del nucleo familiare?"
    );

    if (!confirmed) return;

    setMessage("");
    setRestoringId(backupId);

    const response = await fetch(
      `/api/family/members/backups/${backupId}/restore`,
      { method: "POST" }
    );
    const result = await response.json();

    setRestoringId("");

    if (!response.ok) {
      setMessage(result.error ?? "Non sono riuscita a ripristinare il backup.");
      return;
    }

    setMessage(`Backup ripristinato: ${result.restoredCount} membri.`);
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#f6fbf7] text-[#315a45]">
          <ShieldCheck size={20} aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase text-[#7a6f68]">
            Backup nucleo
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#6c5f57]">
            Prima di modificare i membri salviamo una copia recuperabile.
          </p>
        </div>
      </div>

      {message ? (
        <p className="mt-4 rounded-md border border-[#d5e0d8] bg-[#f6fbf7] px-3 py-2 text-sm font-medium text-[#315a45]">
          {message}
        </p>
      ) : null}

      {backups.length > 0 ? (
        <div className="mt-4 grid gap-2">
          {backups.map((backup) => (
            <div
              className="flex flex-col gap-3 rounded-md border border-[#eadfd7] bg-[#fffaf6] p-3 sm:flex-row sm:items-center sm:justify-between"
              key={backup.id}
            >
              <div>
                <p className="text-sm font-semibold text-[#29302d]">
                  {reasonLabels[backup.reason]}
                  {backup.targetMemberName ? `: ${backup.targetMemberName}` : ""}
                </p>
                <p className="mt-1 text-xs leading-5 text-[#6c5f57]">
                  {backup.memberCount} membri · {formatDate(backup.createdAt)} ·{" "}
                  {backup.userName}
                </p>
              </div>
              <button
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#d5e0d8] bg-white px-3 text-sm font-semibold text-[#315a45] transition hover:bg-[#edf6ef] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={restoringId === backup.id}
                onClick={() => restoreBackup(backup.id)}
                type="button"
              >
                <RotateCcw size={15} aria-hidden="true" />
                {restoringId === backup.id ? "Ripristino..." : "Ripristina"}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-md border border-dashed border-[#d9cfc6] bg-[#fffaf6] px-3 py-3 text-sm text-[#6c5f57]">
          Nessun backup ancora disponibile. Il primo verra creato alla prossima
          modifica del nucleo.
        </p>
      )}
    </div>
  );
}
