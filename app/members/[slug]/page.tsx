import Link from "next/link";
import {
  ArrowLeft,
  ClipboardList,
  Clock3,
  FileText,
  Pill,
  Printer,
  Stethoscope,
} from "lucide-react";
import { connectMongo } from "@/app/lib/mongodb";
import { requireVerifiedUser } from "@/app/lib/auth";
import { getFamilyMembers, memberSlug } from "@/app/lib/family";
import {
  getMedicationTimes,
  medicationTimeSortValue,
} from "@/app/lib/medications";
import { Visit } from "@/app/models/Visit";
import { Recipe } from "@/app/models/Recipe";
import { Medication } from "@/app/models/Medication";
import { HealthDocument } from "@/app/models/HealthDocument";
import { MemberAvatar } from "@/app/components/MemberAvatar";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

function formatDate(value?: Date) {
  if (!value) return "Non impostata";
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

function formatMoney(value?: number) {
  if (value === undefined) return "importo non impostato";

  return new Intl.NumberFormat("it-IT", {
    currency: "EUR",
    style: "currency",
  }).format(value);
}

export default async function MemberPage(context: RouteContext) {
  const user = await requireVerifiedUser();
  const members = await getFamilyMembers(user);
  const { slug } = await context.params;
  const member = members.find((item) => memberSlug(item.name) === slug);

  if (!member) {
    return (
      <main className="min-h-screen bg-[#fffaf6] px-5 py-6 text-[#2f3330] sm:px-8">
        <div className="mx-auto max-w-5xl">
          <Link href="/">Dashboard</Link>
          <p className="mt-6">Membro famiglia non trovato.</p>
        </div>
      </main>
    );
  }

  await connectMongo();
  const [visits, recipes, medications, documents] = await Promise.all([
    Visit.find({ familyId: user.familyId, memberName: member.name }).sort({
      visitDate: 1,
    }),
    Recipe.find({ familyId: user.familyId, memberName: member.name }).sort({
      renewalDate: 1,
    }),
    Medication.find({ familyId: user.familyId, memberName: member.name }).sort({
      createdAt: -1,
    }),
    HealthDocument.find({ familyId: user.familyId, memberName: member.name })
      .sort({ createdAt: -1 })
      .select("-fileData"),
  ]);
  const sortedMedications = [...medications].sort((a, b) =>
    medicationTimeSortValue(getMedicationTimes(a)[0]).localeCompare(
      medicationTimeSortValue(getMedicationTimes(b)[0])
    )
  );
  const timeline = [
    ...visits.map((visit) => ({
      date: visit.visitDate,
      type: "Visita",
      title: String(visit.title),
      detail: visit.visitTime
        ? `${formatDate(visit.visitDate)} · ${visit.visitTime}`
        : formatDate(visit.visitDate),
      note: visit.notes,
    })),
    ...recipes.map((recipe) => ({
      date: recipe.renewalDate ?? recipe.createdAt,
      type: "Ricetta",
      title: String(recipe.medicationName),
      detail: recipe.recipeCode
        ? `Codice ricetta: ${recipe.recipeCode}`
        : "Codice non impostato",
      note: recipe.notes,
    })),
    ...sortedMedications.map((medication) => ({
      date: medication.startDate ?? medication.createdAt,
      type: "Farmaco",
      title: String(medication.name),
      detail: [
        getMedicationTimes(medication).length
          ? `Orari: ${getMedicationTimes(medication).join(", ")}`
          : "Orario non impostato",
        medication.schedule ? `Indicazioni: ${medication.schedule}` : "",
        medication.endDate ? `Fine: ${formatDate(medication.endDate)}` : "",
      ]
        .filter(Boolean)
        .join(" · "),
      note: medication.notes,
    })),
    ...documents.map((document) => ({
      date: document.createdAt,
      type: "Documento",
      title: String(document.title),
      detail:
        document.category === "pagamento"
          ? `Pagamento · ${formatMoney(document.amount)}`
          : String(document.category),
      note: document.notes,
    })),
  ]
    .filter((item) => item.date)
    .sort(
      (a, b) =>
        new Date(b.date as Date).getTime() - new Date(a.date as Date).getTime()
    );

  return (
    <main className="min-h-screen bg-[#fffaf6] px-5 py-6 text-[#2f3330] sm:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          className="inline-flex h-10 items-center gap-2 rounded-md border border-[#e3d7cf] bg-white px-3 text-sm font-semibold text-[#4f5c55] shadow-sm transition hover:bg-[#f8f1ec]"
          href="/"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Dashboard
        </Link>

        <section className="rounded-lg border border-[#eadfd7] bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
            <MemberAvatar
              className="size-12"
              imageDataUrl={member.imageDataUrl}
              name={member.name}
              textClassName="text-lg"
              tone={member.tone}
            />
            <div>
              <p className="text-sm font-medium text-[#947b6a]">{member.role}</p>
              <h1 className="mt-1 text-3xl font-semibold text-[#29302d]">
                {member.name}
              </h1>
            </div>
            </div>
            <Link
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d5e0d8] bg-[#f6fbf7] px-3 text-sm font-semibold text-[#315a45] transition hover:bg-[#edf6ef]"
              href={`/members/${slug}/report`}
            >
              <Printer size={16} aria-hidden="true" />
              Report PDF
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <ProfilePanel icon={Stethoscope} title="Visite">
            {visits.length ? (
              visits.map((visit) => (
                <div
                  className="rounded-md bg-[#fffaf6] px-3 py-2"
                  key={String(visit._id)}
                >
                  <p className="text-sm font-semibold text-[#4f5c55]">
                    {visit.title} · {formatDate(visit.visitDate)}
                    {visit.visitTime ? ` · ${visit.visitTime}` : ""}
                  </p>
                  {visit.notes ? <ItemNote>{visit.notes}</ItemNote> : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-[#6c5f57]">Nessuna visita.</p>
            )}
          </ProfilePanel>

          <ProfilePanel icon={ClipboardList} title="Ricette">
            {recipes.length ? (
              recipes.map((recipe) => (
                <div
                  className="rounded-md bg-[#fffaf6] px-3 py-2"
                  key={String(recipe._id)}
                >
                  <p className="text-sm font-semibold text-[#4f5c55]">
                    {recipe.medicationName} ·{" "}
                    {recipe.recipeCode || "senza codice"}
                  </p>
                  {recipe.notes ? <ItemNote>{recipe.notes}</ItemNote> : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-[#6c5f57]">Nessuna ricetta.</p>
            )}
          </ProfilePanel>

          <ProfilePanel icon={Pill} title="Farmaci">
            {sortedMedications.length ? (
              sortedMedications.map((medication) => (
                <div
                  className="rounded-md bg-[#fffaf6] px-3 py-2"
                  key={String(medication._id)}
                >
                  <p className="text-sm font-semibold text-[#4f5c55]">
                    {medication.name} ·{" "}
                    {medication.dosage || "dosaggio non impostato"}
                  </p>
                  <p className="mt-1 text-xs text-[#7a6f68]">
                    Orari:{" "}
                    {getMedicationTimes(medication).join(", ") ||
                      "Non impostati"}
                  </p>
                  <p className="mt-1 text-xs text-[#7a6f68]">
                    Fine terapia: {formatDate(medication.endDate)}
                  </p>
                  {medication.stockQuantity !== undefined ? (
                    <p className="mt-1 text-xs text-[#7a6f68]">
                      Scorta: {medication.stockQuantity}{" "}
                      {medication.stockUnit || "dosi"}
                    </p>
                  ) : null}
                  {medication.notes ? (
                    <ItemNote>{medication.notes}</ItemNote>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-[#6c5f57]">Nessun farmaco.</p>
            )}
          </ProfilePanel>

          <ProfilePanel icon={FileText} title="Documenti">
            {documents.length ? (
              documents.map((document) => (
                <div
                  className="rounded-md bg-[#fffaf6] px-3 py-2"
                  key={String(document._id)}
                >
                  <p className="text-sm font-semibold text-[#4f5c55]">
                    {document.title} · {document.category}
                  </p>
                  {document.notes ? <ItemNote>{document.notes}</ItemNote> : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-[#6c5f57]">Nessun documento.</p>
            )}
          </ProfilePanel>
        </section>

        <section className="rounded-lg border border-[#eadfd7] bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Clock3 size={18} className="text-[#789888]" aria-hidden="true" />
            <h2 className="font-semibold text-[#29302d]">Timeline salute</h2>
          </div>
          {timeline.length ? (
            <div className="space-y-3">
              {timeline.map((item, index) => (
                <div
                  className="rounded-md border border-[#eee5dd] bg-[#fffaf6] px-3 py-2"
                  key={`${item.type}-${item.title}-${index}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-[#4f5c55]">
                      {item.type}
                    </span>
                    <p className="text-sm font-semibold text-[#29302d]">
                      {item.title}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-[#6c5f57]">{item.detail}</p>
                  {item.note ? <ItemNote>{String(item.note)}</ItemNote> : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#6c5f57]">
              Nessun evento salute registrato.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

function ItemNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1 text-sm leading-6 text-[#6c5f57]">
      <span className="font-semibold text-[#4f5c55]">Note:</span> {children}
    </p>
  );
}

function ProfilePanel({
  children,
  icon: Icon,
  title,
}: {
  children: React.ReactNode;
  icon: typeof Stethoscope;
  title: string;
}) {
  return (
    <div className="rounded-lg border border-[#eadfd7] bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Icon size={18} className="text-[#789888]" aria-hidden="true" />
        <h2 className="font-semibold text-[#29302d]">{title}</h2>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
