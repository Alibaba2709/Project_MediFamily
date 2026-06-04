"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { CalendarPlus, Loader2, PenLine, Plus, X } from "lucide-react";

const fallbackFamilyMembers = ["Utente principale"];

const initialForm = {
  memberName: fallbackFamilyMembers[0],
  title: "",
  doctor: "",
  location: "",
  visitDate: "",
  visitTime: "",
  paymentDueDate: "",
  cancellationDueDate: "",
  price: "",
  status: "booked",
  notes: "",
};

type VisitFormState = typeof initialForm;

type EditableVisit = {
  id: string;
  memberName: string;
  title: string;
  doctor?: string;
  location?: string;
  visitDate: string;
  visitTime?: string;
  paymentDueDate?: string;
  cancellationDueDate?: string;
  price?: number;
  notes?: string;
  status?: "booked" | "paid" | "cancelled" | "completed";
};

type VisitFormProps = {
  mode?: "create" | "edit";
  visit?: EditableVisit;
  familyMembers?: string[];
};

function toDateInput(value?: string) {
  return value ? value.slice(0, 10) : "";
}

function buildInitialForm(
  visit?: EditableVisit,
  familyMembers: string[] = fallbackFamilyMembers
): VisitFormState {
  const defaultMember = familyMembers[0] || fallbackFamilyMembers[0];

  if (!visit) {
    return {
      ...initialForm,
      memberName: defaultMember,
    };
  }

  return {
    memberName: visit.memberName || defaultMember,
    title: visit.title,
    doctor: visit.doctor ?? "",
    location: visit.location ?? "",
    visitDate: toDateInput(visit.visitDate),
    visitTime: visit.visitTime ?? "",
    paymentDueDate: toDateInput(visit.paymentDueDate),
    cancellationDueDate: toDateInput(visit.cancellationDueDate),
    price: visit.price ? String(visit.price) : "",
    status: visit.status ?? "booked",
    notes: visit.notes ?? "",
  };
}

export function VisitForm({
  mode = "create",
  visit,
  familyMembers = fallbackFamilyMembers,
}: VisitFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<VisitFormState>(() =>
    buildInitialForm(visit, familyMembers)
  );
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = mode === "edit";

  function updateField(name: keyof VisitFormState, value: string) {
    setForm((current) => ({ ...initialForm, ...current, [name]: value }));
  }

  function openForm() {
    setForm(buildInitialForm(visit, familyMembers));
    setError("");
    setIsOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.title.trim() || !form.visitDate) {
      setError("Titolo visita e data sono obbligatori.");
      return;
    }

    setIsSaving(true);

    const response = await fetch(
      isEditing && visit ? `/api/visits/${visit.id}` : "/api/visits",
      {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          memberName: form.memberName,
          title: form.title,
          doctor: form.doctor,
          location: form.location,
          visitDate: form.visitDate,
          visitTime: form.visitTime || undefined,
          paymentDueDate: form.paymentDueDate || undefined,
          cancellationDueDate: form.cancellationDueDate || undefined,
          price: form.price ? Number(form.price) : undefined,
          notes: form.notes,
          status: form.status,
        }),
      }
    );

    setIsSaving(false);

    if (!response.ok) {
      setError(
        isEditing
          ? "Non sono riuscita ad aggiornare la visita. Riprova."
          : "Non sono riuscita a salvare la visita. Riprova."
      );
      return;
    }

    setForm(buildInitialForm(visit, familyMembers));
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
        {isEditing ? "Modifica" : "Visita"}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#2f3330]/35 px-4 py-6">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-[#eadfd7] bg-[#fffdfb] shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-[#eadfd7] bg-[#fffdfb] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-[#dbe7fb] text-[#375479]">
                  <CalendarPlus size={21} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#947b6a]">
                    {isEditing ? "Aggiorna agenda" : "Nuova voce agenda"}
                  </p>
                  <h2 className="text-xl font-semibold text-[#29302d]">
                    {isEditing ? "Modifica visita" : "Aggiungi visita"}
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
                    className="h-11 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm text-[#29302d] outline-none transition focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
                    value={form.memberName}
                    onChange={(event) =>
                      updateField("memberName", event.target.value)
                    }
                  >
                    {familyMembers.map((member) => (
                      <option key={member} value={member}>
                        {member}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#4f5c55]">
                    Titolo visita
                  </span>
                  <input
                    className="h-11 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm text-[#29302d] outline-none transition placeholder:text-[#a1968e] focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
                    placeholder="Es. visita cardiologica"
                    value={form.title}
                    onChange={(event) => updateField("title", event.target.value)}
                    required
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#4f5c55]">
                    Medico
                  </span>
                  <input
                    className="h-11 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm text-[#29302d] outline-none transition placeholder:text-[#a1968e] focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
                    placeholder="Es. Dott.ssa Verdi"
                    value={form.doctor}
                    onChange={(event) => updateField("doctor", event.target.value)}
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#4f5c55]">
                    Luogo
                  </span>
                  <input
                    className="h-11 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm text-[#29302d] outline-none transition placeholder:text-[#a1968e] focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
                    placeholder="Es. ASL, studio, ospedale"
                    value={form.location}
                    onChange={(event) =>
                      updateField("location", event.target.value)
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#4f5c55]">
                    Data visita
                  </span>
                  <input
                    className="h-11 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm text-[#29302d] outline-none transition focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
                    type="date"
                    value={form.visitDate}
                    onChange={(event) =>
                      updateField("visitDate", event.target.value)
                    }
                    required
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#4f5c55]">
                    Orario visita
                  </span>
                  <input
                    className="h-11 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm text-[#29302d] outline-none transition focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
                    type="time"
                    value={form.visitTime ?? ""}
                    onChange={(event) =>
                      updateField("visitTime", event.target.value)
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#4f5c55]">
                    Costo ticket
                  </span>
                  <input
                    className="h-11 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm text-[#29302d] outline-none transition placeholder:text-[#a1968e] focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
                    min="0"
                    placeholder="Es. 36.15"
                    step="0.01"
                    type="number"
                    value={form.price}
                    onChange={(event) => updateField("price", event.target.value)}
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#4f5c55]">
                    Stato visita
                  </span>
                  <select
                    className="h-11 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm text-[#29302d] outline-none transition focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
                    value={form.status}
                    onChange={(event) => updateField("status", event.target.value)}
                  >
                    <option value="booked">Prenotata</option>
                    <option value="paid">Pagata</option>
                    <option value="cancelled">Disdetta</option>
                    <option value="completed">Completata</option>
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#4f5c55]">
                    Pagare entro
                  </span>
                  <input
                    className="h-11 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm text-[#29302d] outline-none transition focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
                    type="date"
                    value={form.paymentDueDate}
                    onChange={(event) =>
                      updateField("paymentDueDate", event.target.value)
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#4f5c55]">
                    Disdire entro
                  </span>
                  <input
                    className="h-11 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm text-[#29302d] outline-none transition focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
                    type="date"
                    value={form.cancellationDueDate}
                    onChange={(event) =>
                      updateField("cancellationDueDate", event.target.value)
                    }
                  />
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-[#4f5c55]">
                  Note
                </span>
                <textarea
                  className="min-h-24 w-full resize-y rounded-md border border-[#ded4cb] bg-white px-3 py-3 text-sm text-[#29302d] outline-none transition placeholder:text-[#a1968e] focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
                  placeholder="Es. portare impegnativa, tessera sanitaria, referti precedenti..."
                  value={form.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
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
                    <Loader2
                      className="animate-spin"
                      size={17}
                      aria-hidden="true"
                    />
                  ) : (
                    <Plus size={17} aria-hidden="true" />
                  )}
                  {isEditing ? "Aggiorna visita" : "Salva visita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
