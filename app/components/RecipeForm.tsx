"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardPlus, Loader2, PenLine, Plus, X } from "lucide-react";

const fallbackFamilyMembers = ["Utente principale"];

const initialForm = {
  memberName: fallbackFamilyMembers[0],
  medicationName: "",
  recipeCode: "",
  doctor: "",
  renewalDate: "",
  status: "active",
  notes: "",
};

type EditableRecipe = {
  id: string;
  memberName: string;
  medicationName: string;
  recipeCode?: string;
  doctor?: string;
  renewalDate?: string;
  status: string;
  notes?: string;
};

type RecipeFormProps = {
  mode?: "create" | "edit";
  recipe?: EditableRecipe;
  familyMembers?: string[];
};

function toDateInput(value?: string) {
  return value ? value.slice(0, 10) : "";
}

function buildInitialForm(
  recipe?: EditableRecipe,
  familyMembers: string[] = fallbackFamilyMembers
) {
  if (!recipe) return initialForm;

  return {
    memberName: recipe.memberName || familyMembers[0] || fallbackFamilyMembers[0],
    medicationName: recipe.medicationName,
    recipeCode: recipe.recipeCode ?? "",
    doctor: recipe.doctor ?? "",
    renewalDate: toDateInput(recipe.renewalDate),
    status: recipe.status,
    notes: recipe.notes ?? "",
  };
}

export function RecipeForm({
  mode = "create",
  recipe,
  familyMembers = fallbackFamilyMembers,
}: RecipeFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(() =>
    buildInitialForm(recipe, familyMembers)
  );
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = mode === "edit";

  function openForm() {
    setForm(buildInitialForm(recipe, familyMembers));
    setError("");
    setIsOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.medicationName.trim()) {
      setError("Il nome del farmaco o della ricetta è obbligatorio.");
      return;
    }

    setIsSaving(true);
    const response = await fetch(isEditing && recipe ? `/api/recipes/${recipe.id}` : "/api/recipes", {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        renewalDate: form.renewalDate || undefined,
      }),
    });
    setIsSaving(false);

    if (!response.ok) {
      setError(
        isEditing
          ? "Non sono riuscita ad aggiornare la ricetta. Riprova."
          : "Non sono riuscita a salvare la ricetta. Riprova."
      );
      return;
    }

    setForm(buildInitialForm(recipe));
    setIsOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        className={
          isEditing
            ? "flex h-9 items-center justify-center gap-2 rounded-md border border-[#d5e0d8] bg-[#f6fbf7] px-3 text-sm font-semibold text-[#315a45] transition hover:bg-[#edf6ef]"
            : "flex h-10 items-center gap-2 rounded-md bg-[#315a45] px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#274737]"
        }
        onClick={openForm}
        type="button"
      >
        {isEditing ? (
          <PenLine size={16} aria-hidden="true" />
        ) : (
          <Plus size={17} aria-hidden="true" />
        )}
        {isEditing ? "Modifica" : "Ricetta"}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#2f3330]/35 px-4 py-6">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-[#eadfd7] bg-[#fffdfb] shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-[#eadfd7] bg-[#fffdfb] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-[#faf7ff] text-[#5d527b]">
                  <ClipboardPlus size={21} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#947b6a]">
                    Archivio salute
                  </p>
                  <h2 className="text-xl font-semibold text-[#29302d]">
                    {isEditing ? "Modifica ricetta" : "Aggiungi ricetta"}
                  </h2>
                </div>
              </div>
              <button
                className="flex size-9 items-center justify-center rounded-md border border-[#e3d7cf] bg-white text-[#5f6862] transition hover:bg-[#f8f1ec]"
                onClick={() => setIsOpen(false)}
                type="button"
                aria-label="Chiudi form"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <form className="space-y-5 p-5" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#4f5c55]">
                    Persona
                  </span>
                  <select
                    className="h-11 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm outline-none focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
                    value={form.memberName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        memberName: event.target.value,
                      }))
                    }
                  >
                    {familyMembers.map((member) => (
                      <option key={member}>{member}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#4f5c55]">
                    Stato
                  </span>
                  <select
                    className="h-11 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm outline-none focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
                    value={form.status}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        status: event.target.value,
                      }))
                    }
                  >
                    <option value="active">Attiva</option>
                    <option value="to-renew">Da rinnovare</option>
                    <option value="renewed">Rinnovata</option>
                  </select>
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-[#4f5c55]">
                  Farmaco / ricetta
                </span>
                <input
                  className="h-11 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm outline-none placeholder:text-[#a1968e] focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
                  placeholder="Es. Cardioaspirina"
                  value={form.medicationName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      medicationName: event.target.value,
                    }))
                  }
                  required
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#4f5c55]">
                    Codice ricetta
                  </span>
                  <input
                    className="h-11 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm outline-none placeholder:text-[#a1968e] focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
                    placeholder="Es. 010A1234567890"
                    value={form.recipeCode}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        recipeCode: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#4f5c55]">
                    Medico
                  </span>
                  <input
                    className="h-11 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm outline-none placeholder:text-[#a1968e] focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
                    placeholder="Es. Dott.ssa Verdi"
                    value={form.doctor}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        doctor: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#4f5c55]">
                    Rinnovare entro
                  </span>
                  <input
                    className="h-11 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm outline-none focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
                    type="date"
                    value={form.renewalDate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        renewalDate: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-[#4f5c55]">
                  Note
                </span>
                <textarea
                  className="min-h-24 w-full resize-y rounded-md border border-[#ded4cb] bg-white px-3 py-3 text-sm outline-none placeholder:text-[#a1968e] focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
                  placeholder="Es. Chiedere rinnovo al medico di base..."
                  value={form.notes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />
              </label>

              {error ? (
                <p className="rounded-md border border-[#edc9c3] bg-[#fff7f5] px-3 py-2 text-sm font-medium text-[#7f5146]">
                  {error}
                </p>
              ) : null}

              <div className="flex flex-col-reverse gap-3 border-t border-[#eadfd7] pt-4 sm:flex-row sm:justify-end">
                <button
                  className="h-11 rounded-md border border-[#e3d7cf] bg-white px-4 text-sm font-semibold text-[#4f5c55] transition hover:bg-[#f8f1ec]"
                  onClick={() => setIsOpen(false)}
                  type="button"
                >
                  Annulla
                </button>
                <button
                  className="flex h-11 items-center justify-center gap-2 rounded-md bg-[#315a45] px-4 text-sm font-semibold text-white transition hover:bg-[#274737] disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isSaving}
                  type="submit"
                >
                  {isSaving ? (
                    <Loader2 className="animate-spin" size={17} aria-hidden="true" />
                  ) : (
                    <Plus size={17} aria-hidden="true" />
                  )}
                  {isEditing ? "Aggiorna ricetta" : "Salva ricetta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
