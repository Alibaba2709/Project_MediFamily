import Link from "next/link";
import { ArrowLeft, Pill } from "lucide-react";
import { connectMongo } from "@/app/lib/mongodb";
import { requireVerifiedUser } from "@/app/lib/auth";
import {
  displayFamilyMemberName,
  getFamilyMembers,
  normalizeFamilyMemberNames,
} from "@/app/lib/family";
import { Medication } from "@/app/models/Medication";
import { MedicationForm } from "@/app/components/MedicationForm";
import { DeleteButton } from "@/app/components/DeleteButton";
import { MemberAvatar } from "@/app/components/MemberAvatar";

type StoredMedication = {
  _id: { toString: () => string };
  memberName: string;
  name: string;
  dosage?: string;
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

function formatDate(value?: string) {
  if (!value) return "Non impostata";
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

type MedicationItem = Awaited<ReturnType<typeof getMedications>>[number];

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
      ),
    })),
  ];
}

export default async function MedicationsPage() {
  const user = await requireVerifiedUser();
  const canEdit = user.role !== "viewer";
  const members = await getFamilyMembers(user);
  const medications = await getMedications(user.familyId);
  const visibleMedications = medications.map((medication) => ({
    ...medication,
    memberName: displayFamilyMemberName(medication.memberName, members),
  }));
  const memberNames = normalizeFamilyMemberNames(
    [
      ...members.map((member) => member.name),
      ...medications.map((medication) => medication.memberName),
    ],
    members
  );
  const medicationGroups = groupMedicationsByMember(
    visibleMedications,
    members
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
                Farmaci
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6c5f57]">
                Inserisci farmaci attivi, dosaggi e orari.
              </p>
            </div>
          </div>
        </section>

        {visibleMedications.length > 0 ? (
          <section className="grid gap-4">
            {medicationGroups.map((group) => (
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
                      </div>
                      <p className="mt-1 text-sm text-[#6c5f57]">
                        {medication.dosage || "Dosaggio non impostato"}
                      </p>
                      <p className="mt-3 text-sm text-[#6c5f57]">
                        Orari: {medication.schedule || "Non impostati"}
                      </p>
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
                              mode="edit"
                              medication={medication}
                              familyMembers={memberNames}
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
            ))}
          </section>
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
