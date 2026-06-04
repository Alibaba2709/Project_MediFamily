import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
import { PrintButton } from "@/app/components/PrintButton";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

function formatDate(value?: Date) {
  if (!value) return "Non impostata";

  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "long",
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

export default async function MemberReportPage(context: RouteContext) {
  const user = await requireVerifiedUser();
  const members = await getFamilyMembers(user);
  const { slug } = await context.params;
  const member = members.find((item) => memberSlug(item.name) === slug);

  if (!member) {
    return (
      <main className="min-h-screen bg-white px-6 py-8 text-[#2f3330]">
        <Link href="/">Dashboard</Link>
        <p className="mt-6">Membro famiglia non trovato.</p>
      </main>
    );
  }

  await connectMongo();
  const [visits, recipes, medications, documents] = await Promise.all([
    Visit.find({ familyId: user.familyId, memberName: member.name }).sort({
      visitDate: -1,
    }),
    Recipe.find({ familyId: user.familyId, memberName: member.name }).sort({
      renewalDate: -1,
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

  return (
    <main className="min-h-screen bg-[#fffaf6] px-5 py-6 text-[#2f3330] print:bg-white sm:px-8">
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="flex flex-col justify-between gap-3 print:hidden sm:flex-row sm:items-center">
          <Link
            className="inline-flex h-10 items-center gap-2 rounded-md border border-[#e3d7cf] bg-white px-3 text-sm font-semibold text-[#4f5c55] shadow-sm transition hover:bg-[#f8f1ec]"
            href={`/members/${slug}`}
          >
            <ArrowLeft size={17} aria-hidden="true" />
            Profilo
          </Link>
          <PrintButton pdfHref={`/api/members/${slug}/report/pdf`} />
        </div>

        <section className="rounded-lg border border-[#eadfd7] bg-white p-6 shadow-sm print:border-0 print:shadow-none">
          <p className="text-sm font-semibold uppercase text-[#947b6a]">
            Report salute
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-[#29302d]">
            {member.name}
          </h1>
          <p className="mt-2 text-sm text-[#6c5f57]">
            Generato da MediFamily il {formatDate(new Date())}
          </p>
        </section>

        <ReportSection title="Visite">
          {visits.length ? (
            visits.map((visit) => (
              <ReportItem
                detail={`${formatDate(visit.visitDate)}${
                  visit.visitTime ? ` · ${visit.visitTime}` : ""
                }`}
                key={String(visit._id)}
                note={visit.notes}
                title={String(visit.title)}
              />
            ))
          ) : (
            <EmptyReportLine />
          )}
        </ReportSection>

        <ReportSection title="Ricette">
          {recipes.length ? (
            recipes.map((recipe) => (
              <ReportItem
                detail={`Codice: ${recipe.recipeCode || "non impostato"} · Rinnovo: ${formatDate(recipe.renewalDate)}`}
                key={String(recipe._id)}
                note={recipe.notes}
                title={String(recipe.medicationName)}
              />
            ))
          ) : (
            <EmptyReportLine />
          )}
        </ReportSection>

        <ReportSection title="Farmaci">
          {sortedMedications.length ? (
            sortedMedications.map((medication) => (
              <ReportItem
                detail={`${medication.dosage || "dosaggio non impostato"} · ${
                  getMedicationTimes(medication).join(", ") ||
                  "orario non impostato"
                } · Fine terapia: ${formatDate(medication.endDate)}`}
                key={String(medication._id)}
                note={medication.notes}
                title={String(medication.name)}
              />
            ))
          ) : (
            <EmptyReportLine />
          )}
        </ReportSection>

        <ReportSection title="Documenti">
          {documents.length ? (
            documents.map((document) => (
              <ReportItem
                detail={
                  document.category === "pagamento"
                    ? `Pagamento · ${formatMoney(document.amount)} · ${document.fileName || "scheda senza file"}`
                    : `${document.category} · ${document.fileName || "scheda senza file"}`
                }
                key={String(document._id)}
                note={document.notes}
                title={String(document.title)}
              />
            ))
          ) : (
            <EmptyReportLine />
          )}
        </ReportSection>
      </div>
    </main>
  );
}

function ReportSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-[#eadfd7] bg-white p-5 shadow-sm print:break-inside-avoid print:border-[#d8d8d8] print:shadow-none">
      <h2 className="text-lg font-semibold text-[#29302d]">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function ReportItem({
  detail,
  note,
  title,
}: {
  detail: string;
  note?: string;
  title: string;
}) {
  return (
    <article className="rounded-md bg-[#fffaf6] px-3 py-2 print:bg-white print:px-0">
      <h3 className="text-sm font-semibold text-[#29302d]">{title}</h3>
      <p className="mt-1 text-sm text-[#6c5f57]">{detail}</p>
      {note ? <p className="mt-1 text-sm leading-6 text-[#6c5f57]">Note: {note}</p> : null}
    </article>
  );
}

function EmptyReportLine() {
  return <p className="text-sm text-[#6c5f57]">Nessun dato registrato.</p>;
}
