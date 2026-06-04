"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";

type DeleteButtonProps = {
  endpoint: string;
  label: string;
};

export function DeleteButton({ endpoint, label }: DeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setError("");

    if (!window.confirm(`Eliminare "${label}"?`)) return;

    setIsDeleting(true);
    const response = await fetch(endpoint, { method: "DELETE" });
    setIsDeleting(false);

    if (!response.ok) {
      setError("Non sono riuscita a eliminare. Riprova.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-1">
      <button
        className="flex h-9 items-center justify-center gap-2 rounded-md border border-[#edc9c3] bg-[#fff7f5] px-3 text-sm font-semibold text-[#7f5146] transition hover:bg-[#fdecea] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isDeleting}
        onClick={handleDelete}
        type="button"
      >
        {isDeleting ? (
          <Loader2 className="animate-spin" size={16} aria-hidden="true" />
        ) : (
          <Trash2 size={16} aria-hidden="true" />
        )}
        Elimina
      </button>
      {error ? <p className="text-xs text-[#7f5146]">{error}</p> : null}
    </div>
  );
}
