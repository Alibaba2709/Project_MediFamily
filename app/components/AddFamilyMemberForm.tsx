"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

type AddFamilyMemberFormProps = {
  currentCount: number;
  limit?: number;
  compact?: boolean;
};

export function AddFamilyMemberForm({
  currentCount,
  limit = 6,
  compact = false,
}: AddFamilyMemberFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const isAtLimit = currentCount >= limit;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const response = await fetch("/api/family/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    const result = await response.json();

    setIsSaving(false);

    if (!response.ok) {
      setError(result.error ?? "Non sono riuscita ad aggiungere il membro.");
      return;
    }

    form.reset();
    setIsOpen(false);
    router.refresh();
  }

  if (isAtLimit) {
    return (
      <p className="rounded-md border border-[#f1d8cf] bg-[#fff7f5] px-3 py-2 text-sm text-[#7f5146]">
        Limite gratuito raggiunto. Per aggiungere altri membri sara disponibile
        un piano famiglia premium.
      </p>
    );
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {!isOpen ? (
        <button
          className={
            compact
              ? "flex h-10 w-full items-center justify-center gap-2 rounded-md border border-dashed border-[#d5e0d8] bg-[#f6fbf7] px-3 text-sm font-semibold text-[#315a45] transition hover:bg-[#edf6ef]"
              : "flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#315a45] px-4 text-sm font-semibold text-white transition hover:bg-[#274737]"
          }
          onClick={() => setIsOpen(true)}
          type="button"
        >
          <Plus size={17} aria-hidden="true" />
          Aggiungi membro
        </button>
      ) : (
        <form className="grid gap-2" onSubmit={handleSubmit}>
          <input
            className="h-10 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm outline-none transition placeholder:text-[#a1968e] focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
            name="name"
            placeholder="Nome e cognome"
            required
          />
          <input
            className="h-10 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm outline-none transition placeholder:text-[#a1968e] focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
            name="role"
            placeholder="Ruolo"
            required
          />

          {error ? (
            <p className="rounded-md bg-[#fff7f5] px-3 py-2 text-sm font-medium text-[#9f4d46]">
              {error}
            </p>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            <button
              className="flex h-10 items-center justify-center rounded-md border border-[#e3d7cf] bg-white px-3 text-sm font-semibold text-[#4f5c55] transition hover:bg-[#f8f1ec]"
              onClick={() => {
                setIsOpen(false);
                setError("");
              }}
              type="button"
            >
              Annulla
            </button>
            <button
              className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#315a45] px-3 text-sm font-semibold text-white transition hover:bg-[#274737] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Plus size={16} aria-hidden="true" />
              )}
              Salva
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
