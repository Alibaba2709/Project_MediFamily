"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Ban, CheckCircle2, Loader2 } from "lucide-react";

type VisitStatus = "cancelled" | "completed";

type VisitStatusActionsProps = {
  visitId: string;
  label: string;
};

const actions: Array<{
  status: VisitStatus;
  label: string;
  confirm: string;
  icon: typeof CheckCircle2;
  className: string;
}> = [
  {
    status: "completed",
    label: "Effettuata",
    confirm: "Segnare questa visita come effettuata?",
    icon: CheckCircle2,
    className:
      "border-[#d5e0d8] bg-[#f6fbf7] text-[#315a45] hover:bg-[#edf6ef]",
  },
  {
    status: "cancelled",
    label: "Annullata",
    confirm: "Segnare questa prenotazione come annullata?",
    icon: Ban,
    className:
      "border-[#edc9c3] bg-[#fff7f5] text-[#7f5146] hover:bg-[#fdecea]",
  },
];

export function VisitStatusActions({ visitId, label }: VisitStatusActionsProps) {
  const router = useRouter();
  const [savingStatus, setSavingStatus] = useState<VisitStatus | null>(null);
  const [error, setError] = useState("");

  async function updateStatus(status: VisitStatus, confirmMessage: string) {
    setError("");

    if (!window.confirm(`${confirmMessage}\n\n${label}`)) return;

    setSavingStatus(status);
    const response = await fetch(`/api/visits/${visitId}`, {
      body: JSON.stringify({ status }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    setSavingStatus(null);

    if (!response.ok) {
      setError("Non sono riuscita ad aggiornare la visita. Riprova.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-2 md:justify-end">
        {actions.map((action) => {
          const Icon = action.icon;
          const isSaving = savingStatus === action.status;

          return (
            <button
              className={`flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${action.className}`}
              disabled={savingStatus !== null}
              key={action.status}
              onClick={() => updateStatus(action.status, action.confirm)}
              type="button"
            >
              {isSaving ? (
                <Loader2 className="animate-spin" size={16} aria-hidden="true" />
              ) : (
                <Icon size={16} aria-hidden="true" />
              )}
              {action.label}
            </button>
          );
        })}
      </div>
      {error ? <p className="text-xs text-[#7f5146]">{error}</p> : null}
    </div>
  );
}
