"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Loader2, PenLine, Pill, Plus, X } from "lucide-react";
import { weekdayOptions } from "@/app/lib/medications";

const fallbackFamilyMembers = ["Utente principale"];

const initialForm = {
  memberName: fallbackFamilyMembers[0],
  name: "",
  dosage: "",
  intakeTimes: [""],
  frequency: "daily",
  weekdays: [] as number[],
  startDate: "",
  endDate: "",
  active: "true",
  notes: "",
};

type EditableMedication = {
  id: string;
  memberName: string;
  name: string;
  dosage?: string;
  intakeTime?: string;
  intakeTimes?: string[];
  frequency?: string;
  weekdays?: number[];
  schedule?: string;
  startDate?: string;
  endDate?: string;
  active: boolean;
  notes?: string;
};

type MedicationFormProps = {
  mode?: "create" | "edit";
  medication?: EditableMedication;
  familyMembers?: string[];
};

function toDateInput(value?: string) {
  return value ? value.slice(0, 10) : "";
}

function buildInitialForm(
  medication?: EditableMedication,
  familyMembers: string[] = fallbackFamilyMembers
) {
  const defaultMember = familyMembers[0] || fallbackFamilyMembers[0];

  if (!medication) {
    return {
      ...initialForm,
      memberName: defaultMember,
    };
  }

  return {
    memberName: medication.memberName || defaultMember,
    name: medication.name,
    dosage: medication.dosage ?? "",
    intakeTimes:
      medication.intakeTimes?.length
        ? medication.intakeTimes
        : [medication.intakeTime ?? ""],
    frequency: medication.frequency ?? "daily",
    weekdays: medication.weekdays ?? [],
    startDate: toDateInput(medication.startDate),
    endDate: toDateInput(medication.endDate),
    active: medication.active ? "true" : "false",
    notes: medication.notes ?? "",
  };
}

export function MedicationForm({
  mode = "create",
  medication,
  familyMembers = fallbackFamilyMembers,
}: MedicationFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(() =>
    buildInitialForm(medication, familyMembers)
  );
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = mode === "edit";
  const showWeekdays = form.frequency === "specific_days";

  function openForm() {
    setForm(buildInitialForm(medication, familyMembers));
    setError("");
    setIsOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Il nome del farmaco è obbligatorio.");
      return;
    }

    setIsSaving(true);
    const response = await fetch(
      isEditing && medication
        ? `/api/medications/${medication.id}`
        : "/api/medications",
      {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          startDate: form.startDate || undefined,
          endDate: form.endDate || undefined,
          intakeTimes: form.intakeTimes.filter(Boolean),
          weekdays: showWeekdays ? form.weekdays : [],
          active: form.active === "true",
        }),
      }
    );
    setIsSaving(false);

    if (!response.ok) {
      setError(
        isEditing
          ? "Non sono riuscita ad aggiornare il farmaco. Riprova."
          : "Non sono riuscita a salvare il farmaco. Riprova."
      );
      return;
    }

    setForm(buildInitialForm(medication, familyMembers));
    setIsOpen(false);
    router.refresh();
  }

  function updateIntakeTime(index: number, value: string) {
    setForm((current) => ({
      ...current,
      intakeTimes: current.intakeTimes.map((time, currentIndex) =>
        currentIndex === index ? value : time
      ),
    }));
  }

  function addIntakeTime() {
    setForm((current) => ({
      ...current,
      intakeTimes: [...current.intakeTimes, ""],
    }));
  }

  function removeIntakeTime(index: number) {
    setForm((current) => ({
      ...current,
      intakeTimes:
        current.intakeTimes.length > 1
          ? current.intakeTimes.filter((_, currentIndex) => currentIndex !== index)
          : [""],
    }));
  }

  function toggleWeekday(day: number) {
    setForm((current) => {
      const weekdays = current.weekdays.includes(day)
        ? current.weekdays.filter((item) => item !== day)
        : [...current.weekdays, day];

      return {
        ...current,
        weekdays,
      };
    });
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
        {isEditing ? "Modifica" : "Farmaco"}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#2f3330]/35 px-4 py-6">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-[#eadfd7] bg-[#fffdfb] shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-[#eadfd7] bg-[#fffdfb] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-[#f6fbf7] text-[#315a45]">
                  <Pill size={21} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#947b6a]">
                    Archivio salute
                  </p>
                  <h2 className="text-xl font-semibold text-[#29302d]">
                    {isEditing ? "Modifica farmaco" : "Aggiungi farmaco"}
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
                    value={form.active}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        active: event.target.value,
                      }))
                    }
                  >
                    <option value="true">Attivo</option>
                    <option value="false">Sospeso</option>
                  </select>
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-[#4f5c55]">
                  Nome farmaco
                </span>
                <input
                  className="h-11 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm outline-none placeholder:text-[#a1968e] focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
                  placeholder="Es. Tachipirina"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  required
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#4f5c55]">
                    Dosaggio
                  </span>
                  <input
                    className="h-11 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm outline-none placeholder:text-[#a1968e] focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
                    placeholder="Es. 500 mg"
                    value={form.dosage}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        dosage: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#4f5c55]">
                    Inizio terapia
                  </span>
                  <input
                    className="h-11 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm outline-none focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
                    type="date"
                    value={form.startDate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        startDate: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#4f5c55]">
                    Fine terapia
                  </span>
                  <input
                    className="h-11 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm outline-none focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
                    type="date"
                    value={form.endDate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        endDate: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#4f5c55]">
                    Orario assunzione
                  </span>
                  <div className="space-y-2">
                    {form.intakeTimes.map((time, index) => (
                      <div className="flex gap-2" key={index}>
                        <input
                          className="h-11 min-w-0 flex-1 rounded-md border border-[#ded4cb] bg-white px-3 text-sm outline-none focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
                          type="time"
                          value={time}
                          onChange={(event) =>
                            updateIntakeTime(index, event.target.value)
                          }
                        />
                        <button
                          aria-label="Rimuovi orario"
                          className="flex size-11 shrink-0 items-center justify-center rounded-md border border-[#edc9c3] bg-[#fff7f5] text-[#8a564c] transition hover:bg-[#fdecea]"
                          onClick={() => removeIntakeTime(index)}
                          type="button"
                        >
                          <X size={17} aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                    <button
                      className="inline-flex h-10 items-center gap-2 rounded-md border border-[#d5e0d8] bg-[#f6fbf7] px-3 text-sm font-semibold text-[#315a45] transition hover:bg-[#edf6ef]"
                      onClick={addIntakeTime}
                      type="button"
                    >
                      <Plus size={16} aria-hidden="true" />
                      Aggiungi orario
                    </button>
                  </div>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#4f5c55]">
                    Frequenza
                  </span>
                  <select
                    className="h-11 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm outline-none focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
                    value={form.frequency}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        frequency: event.target.value,
                        weekdays:
                          event.target.value === "specific_days"
                            ? current.weekdays
                            : [],
                      }))
                    }
                  >
                    <option value="daily">Tutti i giorni</option>
                    <option value="specific_days">Giorni specifici</option>
                    <option value="as_needed">Al bisogno</option>
                  </select>
                </label>
              </div>

              {showWeekdays ? (
                <div className="space-y-2">
                  <span className="text-sm font-semibold text-[#4f5c55]">
                    Giorni terapia
                  </span>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                    {weekdayOptions.map((day) => {
                      const selected = form.weekdays.includes(day.value);

                      return (
                        <button
                          className={
                            selected
                              ? "h-10 rounded-md bg-[#315a45] text-sm font-semibold text-white"
                              : "h-10 rounded-md border border-[#ded4cb] bg-white text-sm font-semibold text-[#4f5c55]"
                          }
                          key={day.value}
                          onClick={() => toggleWeekday(day.value)}
                          type="button"
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-[#4f5c55]">
                  Note
                </span>
                <textarea
                  className="min-h-24 w-full resize-y rounded-md border border-[#ded4cb] bg-white px-3 py-3 text-sm outline-none placeholder:text-[#a1968e] focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
                  placeholder="Es. Dopo pasti, prima di dormire, non assumere a stomaco vuoto..."
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
                    <Clock size={17} aria-hidden="true" />
                  )}
                  {isEditing ? "Aggiorna farmaco" : "Salva farmaco"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
