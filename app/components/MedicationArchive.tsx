"use client";

import { Pill } from "lucide-react";
import {
  frequencyLabels,
  getMedicationTimes,
  todayDateKey,
} from "@/app/lib/medications";
import { DeleteButton } from "@/app/components/DeleteButton";
import { MedicationForm } from "@/app/components/MedicationForm";
import { MemberAvatar } from "@/app/components/MemberAvatar";

type MedicationItem = {
  id: string;
  memberName: string;
  name: string;
  dosage?: string;
  stockQuantity?: number;
  stockUnit?: string;
  unitsPerDose?: number;
  lowStockThreshold?: number;
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

type MedicationGroup = {
  imageDataUrl?: string;
  medications: MedicationItem[];
  name: string;
  role: string;
  tone: string;
};

type MedicationArchiveProps = {
  canEdit: boolean;
  groups: MedicationGroup[];
  memberNames: string[];
};

function formatDate(value?: string) {
  if (!value) return "Non impostata";
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function isEnded(medication: MedicationItem) {
  return Boolean(medication.endDate && medication.endDate < todayDateKey());
}

function hasLowStock(medication: MedicationItem) {
  return (
    medication.stockQuantity !== undefined &&
    medication.lowStockThreshold !== undefined &&
    medication.stockQuantity <= medication.lowStockThreshold
  );
}

function formatStock(medication: MedicationItem) {
  if (medication.stockQuantity === undefined) return "Non impostata";

  return `${medication.stockQuantity} ${medication.stockUnit || "dosi"}`;
}

export function MedicationArchive({
  canEdit,
  groups,
  memberNames,
}: MedicationArchiveProps) {
  return (
    <section className="grid gap-4">
      {groups.length > 0 ? (
        groups.map((group) => (
          <div
            className="rounded-lg border border-[#eadfd7] bg-[#fffdfb] p-4 shadow-sm"
            key={group.name}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <MemberAvatar
                  imageDataUrl={group.imageDataUrl}
                  name={group.name}
                  tone={group.tone}
                />
                <div>
                  <h2 className="text-sm font-semibold text-[#29302d]">
                    {group.name}
                  </h2>
                  <p className="text-xs text-[#7a6f68]">{group.role}</p>
                </div>
              </div>
              <span className="rounded-md bg-[#f6fbf7] px-2 py-1 text-xs font-semibold text-[#315a45]">
                {group.medications.length === 1
                  ? "1 farmaco"
                  : `${group.medications.length} farmaci`}
              </span>
            </div>

            <div className="grid gap-3">
              {group.medications.map((medication) => (
                <article
                  className="medication-card scroll-mt-24 rounded-lg border border-[#eadfd7] bg-white p-4 transition"
                  id={`medication-${medication.id}`}
                  key={medication.id}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-[#29302d]">
                      {medication.name}
                    </h3>
                    <span className="rounded-md bg-[#f6fbf7] px-2 py-1 text-xs font-semibold text-[#315a45]">
                      {medication.active ? "Attivo" : "Sospeso"}
                    </span>
                    {isEnded(medication) ? (
                      <span className="rounded-md bg-[#fff8e9] px-2 py-1 text-xs font-semibold text-[#7a5b2f]">
                        Terminato
                      </span>
                    ) : null}
                    {hasLowStock(medication) ? (
                      <span className="rounded-md bg-[#fff7f5] px-2 py-1 text-xs font-semibold text-[#8a564c]">
                        Scorta bassa
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-[#6c5f57]">
                    {medication.dosage || "Dosaggio non impostato"}
                  </p>
                  <p className="mt-3 text-sm text-[#6c5f57]">
                    Orari:{" "}
                    {getMedicationTimes(medication).join(", ") ||
                      "Non impostati"}
                  </p>
                  <p className="mt-1 text-sm text-[#6c5f57]">
                    Frequenza: {frequencyLabels[medication.frequency ?? "daily"]}
                  </p>
                  <p className="mt-1 text-sm text-[#6c5f57]">
                    Scorta: {formatStock(medication)}
                    {medication.unitsPerDose
                      ? ` · consumo ${medication.unitsPerDose} per dose`
                      : ""}
                  </p>
                  {medication.schedule ? (
                    <p className="mt-1 text-sm text-[#6c5f57]">
                      Indicazioni salvate: {medication.schedule}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm text-[#6c5f57]">
                    Inizio terapia: {formatDate(medication.startDate)}
                  </p>
                  <p className="mt-1 text-sm text-[#6c5f57]">
                    Fine terapia: {formatDate(medication.endDate)}
                  </p>
                  {medication.notes ? (
                    <p className="mt-2 text-sm leading-6 text-[#6c5f57]">
                      {medication.notes}
                    </p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {canEdit ? (
                      <>
                        <MedicationForm
                          familyMembers={memberNames}
                          medication={medication}
                          mode="edit"
                        />
                        <DeleteButton
                          endpoint={`/api/medications/${medication.id}`}
                          label={medication.name}
                        />
                      </>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))
      ) : (
        <section className="rounded-lg border border-dashed border-[#d9cfc6] bg-white p-6 text-center shadow-sm">
          <Pill size={28} className="mx-auto text-[#947b6a]" aria-hidden="true" />
          <h2 className="mt-3 text-base font-semibold text-[#29302d]">
            Nessun farmaco in questo filtro
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6c5f57]">
            Cambia filtro oppure aggiungi una nuova terapia.
          </p>
        </section>
      )}
    </section>
  );
}
