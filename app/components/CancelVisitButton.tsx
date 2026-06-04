"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Ban, Loader2 } from "lucide-react";

type CancelVisitButtonProps = {
  visitId: string;
  label: string;
};

export function CancelVisitButton({ visitId, label }: CancelVisitButtonProps) {
  const router = useRouter();
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState("");

  async function cancelVisit() {
    setError("");

    if (!window.confirm(`Annullare la prenotazione "${label}"?`)) return;

    setIsCancelling(true);
    const response = await fetch(`/api/visits/${visitId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    setIsCancelling(false);

    if (!response.ok) {
      setError("Non sono riuscita ad annullare la visita. Riprova.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-1">
      <button
        className="flex h-9 items-center justify-center gap-2 rounded-md border border-[#edc9c3] bg-[#fff7f5] px-3 text-sm font-semibold text-[#7f5146] transition hover:bg-[#fdecea] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isCancelling}
        onClick={cancelVisit}
        type="button"
      >
        {isCancelling ? (
          <Loader2 className="animate-spin" size={16} aria-hidden="true" />
        ) : (
          <Ban size={16} aria-hidden="true" />
        )}
        Annulla
      </button>
      {error ? <p className="text-xs text-[#7f5146]">{error}</p> : null}
    </div>
  );
}
