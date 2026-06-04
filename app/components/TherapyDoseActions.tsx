"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2, XCircle } from "lucide-react";

type TherapyDoseActionsProps = {
  canEdit: boolean;
  intakeDate: string;
  intakeTime: string;
  medicationId: string;
  status?: "taken" | "skipped";
};

const statusLabels = {
  skipped: "Saltato",
  taken: "Preso",
};

export function TherapyDoseActions({
  canEdit,
  intakeDate,
  intakeTime,
  medicationId,
  status,
}: TherapyDoseActionsProps) {
  const router = useRouter();
  const [pendingStatus, setPendingStatus] = useState<
    "taken" | "skipped" | ""
  >("");

  async function saveStatus(nextStatus: "taken" | "skipped") {
    setPendingStatus(nextStatus);

    const response = await fetch("/api/medication-intakes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        intakeDate,
        intakeTime,
        medicationId,
        status: nextStatus,
      }),
    });

    setPendingStatus("");

    if (response.ok) {
      router.refresh();
    }
  }

  if (!canEdit) {
    return status ? (
      <span className="rounded-md bg-[#f6fbf7] px-2 py-1 text-xs font-semibold text-[#315a45]">
        {statusLabels[status]}
      </span>
    ) : null;
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:flex">
      <button
        className={
          status === "taken"
            ? "inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#315a45] px-3 text-sm font-semibold text-white"
            : "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d5e0d8] bg-[#f6fbf7] px-3 text-sm font-semibold text-[#315a45] transition hover:bg-[#edf6ef]"
        }
        disabled={Boolean(pendingStatus)}
        onClick={() => saveStatus("taken")}
        type="button"
      >
        {pendingStatus === "taken" ? (
          <Loader2 className="animate-spin" size={16} aria-hidden="true" />
        ) : (
          <CheckCircle size={16} aria-hidden="true" />
        )}
        Preso
      </button>
      <button
        className={
          status === "skipped"
            ? "inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#8a564c] px-3 text-sm font-semibold text-white"
            : "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#edc9c3] bg-[#fff7f5] px-3 text-sm font-semibold text-[#8a564c] transition hover:bg-[#fdecea]"
        }
        disabled={Boolean(pendingStatus)}
        onClick={() => saveStatus("skipped")}
        type="button"
      >
        {pendingStatus === "skipped" ? (
          <Loader2 className="animate-spin" size={16} aria-hidden="true" />
        ) : (
          <XCircle size={16} aria-hidden="true" />
        )}
        Saltato
      </button>
    </div>
  );
}
