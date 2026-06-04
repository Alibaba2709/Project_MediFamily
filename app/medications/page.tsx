import Link from "next/link";
import { ArrowLeft, CalendarCheck, Clock3, Pill } from "lucide-react";
import { connectMongo } from "@/app/lib/mongodb";
import { requireVerifiedUser } from "@/app/lib/auth";
import {
  displayFamilyMemberName,
  getFamilyMembers,
  normalizeFamilyMemberNames,
} from "@/app/lib/family";
import {
  getMedicationTimes,
  isMedicationDueOnDate,
  medicationTimeSortValue,
  todayDateKey,
} from "@/app/lib/medications";
import { Medication } from "@/app/models/Medication";
import { MedicationIntake } from "@/app/models/MedicationIntake";
import { MedicationForm } from "@/app/components/MedicationForm";
import { MemberAvatar } from "@/app/components/MemberAvatar";
import { TherapyDoseActions } from "@/app/components/TherapyDoseActions";
import { MedicationArchive } from "@/app/components/MedicationArchive";

type StoredMedication = {
  _id: { toString: () => string };
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
  startDate?: Date;
  endDate?: Date;
  active: boolean;
  notes?: string;
};

async function getMedications(familyId: string) {
  try {
    await connectMongo();

    const medications = await Medication.find({ familyId })
      .sort({ createdAt: -1 })
      .lean<StoredMedication[]>();

    return medications.map((medication) => ({
      id: medication._id.toString(),
      memberName: medication.memberName,
      name: medication.name,
      dosage: medication.dosage,
      stockQuantity: medication.stockQuantity,
      stockUnit: medication.stockUnit,
      unitsPerDose: medication.unitsPerDose,
      lowStockThreshold: medication.lowStockThreshold,
      intakeTime: medication.intakeTime,
      intakeTimes: medication.intakeTimes ?? [],
      frequency: medication.frequency ?? "daily",
      weekdays: medication.weekdays ?? [],
      schedule: medication.schedule,
      startDate: medication.startDate?.toISOString(),
      endDate: medication.endDate?.toISOString(),
      active: medication.active,
      notes: medication.notes,
    }));
  } catch {
    return [];
  }
}

type StoredIntake = {
  medicationId: { toString: () => string };
  intakeTime: string;
  status: "taken" | "skipped";
};

type StoredRecentIntake = StoredIntake & {
  intakeDate: string;
  medicationName: string;
  memberName: string;
};

async function getTodayIntakes(familyId: string, intakeDate: string) {
  try {
    await connectMongo();

    const intakes = await MedicationIntake.find({ familyId, intakeDate }).lean<
      StoredIntake[]
    >();

    return intakes.map((intake) => ({
      medicationId: intake.medicationId.toString(),
      intakeTime: intake.intakeTime,
      status: intake.status,
    }));
  } catch {
    return [];
  }
}

async function getRecentIntakes(familyId: string) {
  try {
    await connectMongo();

    const intakes = await MedicationIntake.find({ familyId })
      .sort({ intakeDate: -1, intakeTime: -1 })
      .limit(12)
      .lean<StoredRecentIntake[]>();

    return intakes.map((intake) => ({
      intakeDate: intake.intakeDate,
      intakeTime: intake.intakeTime,
      medicationId: intake.medicationId.toString(),
      medicationName: intake.medicationName,
      memberName: intake.memberName,
      status: intake.status,
    }));
  } catch {
    return [];
  }
}

function formatDate(value?: string) {
  if (!value) return "Non impostata";
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

type MedicationItem = Awaited<ReturnType<typeof getMedications>>[number];
type IntakeItem = Awaited<ReturnType<typeof getTodayIntakes>>[number];
type MedicationsPageProps = {
  searchParams?: Promise<{
    member?: string;
  }>;
};

function getDoseStatusLabel(
  time: string,
  status?: "taken" | "skipped"
) {
  if (status === "taken") return "Preso";
  if (status === "skipped") return "Saltato";

  const [hours, minutes] = time.split(":").map(Number);
  const doseDate = new Date();
  doseDate.setHours(hours, minutes, 0, 0);

  return doseDate < new Date() ? "Da confermare" : "Programmato";
}

function getDoseStatusTone(statusLabel: string) {
  const tones: Record<string, string> = {
    "Da confermare": "bg-[#fff8e9] text-[#7a5b2f]",
    Preso: "bg-[#d9eadf] text-[#315a45]",
    Programmato: "bg-[#f6fbf7] text-[#315a45]",
    Saltato: "bg-[#fff7f5] text-[#8a564c]",
  };

  return tones[statusLabel] ?? tones.Programmato;
}

function hasLowStock(medication: MedicationItem) {
  return (
    medication.stockQuantity !== undefined &&
    medication.lowStockThreshold !== undefined &&
    medication.stockQuantity <= medication.lowStockThreshold
  );
}

function formatStock(medication: MedicationItem) {
  if (medication.stockQuantity === undefined) return "";
  return `${medication.stockQuantity} ${medication.stockUnit || "dosi"}`;
}

function buildTodayTherapies(
  medications: MedicationItem[],
  intakes: IntakeItem[],
  today: Date
) {
  const intakeStatusByDose = new Map(
    intakes.map((intake) => [
      `${intake.medicationId}:${intake.intakeTime}`,
      intake.status,
    ])
  );

  return medications
    .filter((medication) => isMedicationDueOnDate(medication, today))
    .flatMap((medication) =>
      getMedicationTimes(medication).map((time) => {
        const status = intakeStatusByDose.get(`${medication.id}:${time}`);

        return {
          dosage: medication.dosage,
          intakeTime: time,
          medicationId: medication.id,
          memberName: medication.memberName,
          name: medication.name,
          notes: medication.notes,
          stockLabel: formatStock(medication),
          stockLow: hasLowStock(medication),
          status,
          statusLabel: getDoseStatusLabel(time, status),
        };
      })
    )
    .sort((a, b) =>
      medicationTimeSortValue(a.intakeTime).localeCompare(
        medicationTimeSortValue(b.intakeTime)
      )
    );
}

function groupMedicationsByMember(
  medications: MedicationItem[],
  members: Awaited<ReturnType<typeof getFamilyMembers>>
) {
  const knownMemberNames = new Set(members.map((member) => member.name));
  const memberGroups = members
    .map((member) => ({
      ...member,
      medications: medications.filter(
        (medication) => medication.memberName === member.name
      ).sort((a, b) =>
        medicationTimeSortValue(a.intakeTime).localeCompare(
          medicationTimeSortValue(b.intakeTime)
        )
      ),
    }))
    .filter((group) => group.medications.length > 0);
  const savedOnlyNames = Array.from(
    new Set(
      medications
        .map((medication) => medication.memberName)
        .filter((name) => name && !knownMemberNames.has(name))
    )
  );

  return [
    ...memberGroups,
    ...savedOnlyNames.map((name) => ({
      name,
      role: "Profilo salvato",
      tone: "bg-[#f7e2bf]",
      imageDataUrl: undefined,
      medications: medications.filter(
        (medication) => medication.memberName === name
      ).sort((a, b) =>
        medicationTimeSortValue(a.intakeTime).localeCompare(
          medicationTimeSortValue(b.intakeTime)
        )
      ),
    })),
  ];
}

export default async function MedicationsPage({
  searchParams,
}: MedicationsPageProps) {
  const user = await requireVerifiedUser();
  const canEdit = user.role !== "viewer";
  const members = await getFamilyMembers(user);
  const medications = await getMedications(user.familyId);
  const today = new Date();
  const intakeDate = todayDateKey(today);
  const intakes = await getTodayIntakes(user.familyId, intakeDate);
  const recentIntakes = await getRecentIntakes(user.familyId);
  const visibleMedications = medications.map((medication) => ({
    ...medication,
    memberName: displayFamilyMemberName(medication.memberName, members),
  }));
  const todayTherapies = buildTodayTherapies(
    visibleMedications,
    intakes,
    today
  );
  const memberNames = normalizeFamilyMemberNames(
    [
      ...members.map((member) => member.name),
      ...medications.map((medication) => medication.memberName),
    ],
    members
  );
  const params = await searchParams;
  const selectedMember =
    params?.member && memberNames.includes(params.member)
      ? params.member
      : "all";
  const medicationGroups = groupMedicationsByMember(
    visibleMedications,
    members
  );
  const filteredMedicationGroups =
    selectedMember === "all"
      ? medicationGroups
      : medicationGroups.filter((group) => group.name === selectedMember);
  const todayTherapiesByMember = members
    .map((member) => ({
      ...member,
      therapies: todayTherapies.filter(
        (therapy) => therapy.memberName === member.name
      ),
    }))
    .filter((group) => group.therapies.length > 0);
  const filteredTodayTherapiesByMember =
    selectedMember === "all"
      ? todayTherapiesByMember
      : todayTherapiesByMember.filter((group) => group.name === selectedMember);
  const filteredTodayTherapies = filteredTodayTherapiesByMember.flatMap(
    (group) => group.therapies
  );
  const filteredRecentIntakes =
    selectedMember === "all"
      ? recentIntakes
      : recentIntakes.filter(
          (intake) =>
            displayFamilyMemberName(intake.memberName, members) ===
            selectedMember
        );

  return (
    <main className="min-h-screen bg-[#fffaf6] px-5 py-6 text-[#2f3330] sm:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <Link
            className="inline-flex h-10 items-center gap-2 rounded-md border border-[#e3d7cf] bg-white px-3 text-sm font-semibold text-[#4f5c55] shadow-sm transition hover:bg-[#f8f1ec]"
            href="/"
          >
            <ArrowLeft size={17} aria-hidden="true" />
            Dashboard
          </Link>
          {canEdit ? <MedicationForm familyMembers={memberNames} /> : null}
        </div>

        <section className="rounded-lg border border-[#eadfd7] bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-[#f6fbf7] text-[#315a45]">
              <Pill size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#947b6a]">
                Archivio salute
              </p>
              <h1 className="mt-1 text-3xl font-semibold text-[#29302d]">
                Terapie
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6c5f57]">
                Segui le terapie giornaliere, gli orari e lo storico delle
                assunzioni.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[#eadfd7] bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold uppercase text-[#947b6a]">
            Visualizza terapie
          </p>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
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
        </section>

        <section className="rounded-lg border border-[#eadfd7] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-[#f6fbf7] text-[#315a45]">
                <CalendarCheck size={20} aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#947b6a]">
                  Terapie di oggi
                </p>
                <h2 className="text-lg font-semibold text-[#29302d]">
                  {formatDate(intakeDate)}
                </h2>
              </div>
            </div>
            <span className="rounded-md bg-[#f6fbf7] px-2 py-1 text-xs font-semibold text-[#315a45]">
              {filteredTodayTherapies.length === 1
                ? "1 dose"
                : `${filteredTodayTherapies.length} dosi`}
            </span>
          </div>

          {filteredTodayTherapiesByMember.length > 0 ? (
            <div className="grid gap-4">
              {filteredTodayTherapiesByMember.map((group) => (
                <div
                  className="rounded-lg border border-[#eadfd7] bg-[#fffdfb] p-4"
                  key={group.name}
                >
                  <div className="mb-3 flex items-center gap-3">
                    <MemberAvatar
                      imageDataUrl={group.imageDataUrl}
                      name={group.name}
                      tone={group.tone}
                    />
                    <div>
                      <h3 className="text-sm font-semibold text-[#29302d]">
                        {group.name}
                      </h3>
                      <p className="text-xs text-[#7a6f68]">{group.role}</p>
                    </div>
                  </div>
                  <div className="grid gap-3">
                    {group.therapies.map((therapy) => (
                      <article
                        className="rounded-lg border border-[#eadfd7] bg-white p-4"
                        key={`${therapy.medicationId}-${therapy.intakeTime}`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-1 rounded-md bg-[#f6fbf7] px-2 py-1 text-xs font-semibold text-[#315a45]">
                                <Clock3 size={14} aria-hidden="true" />
                                {therapy.intakeTime}
                              </span>
                              <span
                                className={`rounded-md px-2 py-1 text-xs font-semibold ${getDoseStatusTone(
                                  therapy.statusLabel
                                )}`}
                              >
                                {therapy.statusLabel}
                              </span>
                            </div>
                            <h4 className="mt-2 font-semibold text-[#29302d]">
                              {therapy.name}
                            </h4>
                            <p className="mt-1 text-sm text-[#6c5f57]">
                              {therapy.dosage || "Dosaggio non impostato"}
                            </p>
                            {therapy.notes ? (
                              <p className="mt-1 text-sm text-[#6c5f57]">
                                {therapy.notes}
                              </p>
                            ) : null}
                            {therapy.stockLabel ? (
                              <p className="mt-1 text-sm text-[#6c5f57]">
                                Scorta: {therapy.stockLabel}
                                {therapy.stockLow ? " · bassa" : ""}
                              </p>
                            ) : null}
                          </div>
                          <TherapyDoseActions
                            canEdit={canEdit}
                            intakeDate={intakeDate}
                            intakeTime={therapy.intakeTime}
                            medicationId={therapy.medicationId}
                            status={therapy.status}
                          />
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-[#d9cfc6] bg-[#fffdfb] px-4 py-5 text-sm text-[#6c5f57]">
              Nessuna terapia programmata per oggi.
            </p>
          )}
        </section>

        {filteredRecentIntakes.length > 0 ? (
          <section className="rounded-lg border border-[#eadfd7] bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[#947b6a]">
                  Storico terapie
                </p>
                <h2 className="text-lg font-semibold text-[#29302d]">
                  Ultime assunzioni registrate
                </h2>
              </div>
            </div>
            <div className="grid gap-2">
              {filteredRecentIntakes.map((intake) => (
                <div
                  className="flex flex-col gap-2 rounded-lg border border-[#eadfd7] bg-[#fffdfb] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  key={`${intake.medicationId}-${intake.intakeDate}-${intake.intakeTime}`}
                >
                  <div>
                    <p className="text-sm font-semibold text-[#29302d]">
                      {displayFamilyMemberName(intake.memberName, members)} ·{" "}
                      {intake.medicationName}
                    </p>
                    <p className="mt-1 text-xs text-[#7a6f68]">
                      {formatDate(intake.intakeDate)} · {intake.intakeTime}
                    </p>
                  </div>
                  <span
                    className={`w-fit rounded-md px-2 py-1 text-xs font-semibold ${getDoseStatusTone(
                      intake.status === "taken" ? "Preso" : "Saltato"
                    )}`}
                  >
                    {intake.status === "taken" ? "Preso" : "Saltato"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {visibleMedications.length > 0 ? (
          <MedicationArchive
            canEdit={canEdit}
            groups={filteredMedicationGroups}
            memberNames={memberNames}
            todayMedicationIds={Array.from(
              new Set(
                filteredTodayTherapies.map((therapy) => therapy.medicationId)
              )
            )}
          />
        ) : (
          <section className="rounded-lg border border-dashed border-[#d9cfc6] bg-white p-6 text-center shadow-sm">
            <Pill size={28} className="mx-auto text-[#947b6a]" aria-hidden="true" />
            <h2 className="mt-3 text-base font-semibold text-[#29302d]">
              Nessun farmaco inserito
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6c5f57]">
              Premi Farmaco per aggiungere terapia, dosaggio e orari.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
