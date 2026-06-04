"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
  selectedMember: string;
  todayMedicationIds: string[];
};

const filterLabels = {
  active: "Attivi",
  all: "Tutti",
  ended: "Terminati",
  suspended: "Sospesi",
  today: "Oggi",
};

type FilterKey = keyof typeof filterLabels;

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

function matchesFilter(
  medication: MedicationItem,
  filter: FilterKey,
  todayMedicationIds: Set<string>
) {
  if (filter === "today") return todayMedicationIds.has(medication.id);
  if (filter === "active") return medication.active && !isEnded(medication);
  if (filter === "ended") return isEnded(medication);
  if (filter === "suspended") return !medication.active;

  return true;
}

export function MedicationArchive({
  canEdit,
  groups,
  memberNames,
  selectedMember,
  todayMedicationIds,
}: MedicationArchiveProps) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const todayMedicationIdSet = useMemo(
    () => new Set(todayMedicationIds),
    [todayMedicationIds]
  );
  const counts = useMemo(() => {
    const medications = groups.flatMap((group) => group.medications);

    return {
      active: medications.filter((medication) =>
        matchesFilter(medication, "active", todayMedicationIdSet)
      ).length,
      all: medications.length,
      ended: medications.filter((medication) =>
        matchesFilter(medication, "ended", todayMedicationIdSet)
      ).length,
      suspended: medications.filter((medication) =>
        matchesFilter(medication, "suspended", todayMedicationIdSet)
      ).length,
      today: medications.filter((medication) =>
        matchesFilter(medication, "today", todayMedicationIdSet)
      ).length,
    };
  }, [groups, todayMedicationIdSet]);
  const filteredGroups = groups
    .map((group) => ({
      ...group,
      medications: group.medications.filter((medication) =>
        matchesFilter(medication, filter, todayMedicationIdSet)
      ),
    }))
    .filter((group) => group.medications.length > 0);

  return (
    <section className="grid gap-4">
      <div className="rounded-lg border border-[#eadfd7] bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold uppercase text-[#947b6a]">
          Filtri rapidi
        </p>
        <div className="mt-3 space-y-2">
          <p className="text-xs font-semibold uppercase text-[#947b6a]">
            Familiare
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Link
              className={
                selectedMember === "all"
                  ? "whitespace-nowrap rounded-md bg-[#315a45] px-3 py-2 text-sm font-semibold text-white"
                  : "whitespace-nowrap rounded-md border border-[#ded4cb] bg-[#fffdfb] px-3 py-2 text-sm font-semibold text-[#4f5c55]"
              }
              href="/medications"
            >
              Tutti
            </Link>
            {memberNames.map((memberName) => (
              <Link
                className={
                  selectedMember === memberName
                    ? "whitespace-nowrap rounded-md bg-[#315a45] px-3 py-2 text-sm font-semibold text-white"
                    : "whitespace-nowrap rounded-md border border-[#ded4cb] bg-[#fffdfb] px-3 py-2 text-sm font-semibold text-[#4f5c55]"
                }
                href={{
                  pathname: "/medications",
                  query: { member: memberName },
                }}
                key={memberName}
              >
                {memberName}
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase text-[#947b6a]">
            Stato terapia
          </p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {(Object.keys(filterLabels) as FilterKey[]).map((key) => (
            <button
              className={
                filter === key
                  ? "h-10 rounded-md bg-[#315a45] px-3 text-sm font-semibold text-white"
                  : "h-10 rounded-md border border-[#ded4cb] bg-[#fffdfb] px-3 text-sm font-semibold text-[#4f5c55]"
              }
              key={key}
              onClick={() => setFilter(key)}
              type="button"
            >
              {filterLabels[key]} · {counts[key]}
            </button>
          ))}
        </div>
        </div>
      </div>

      {filteredGroups.length > 0 ? (
        filteredGroups.map((group) => (
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
