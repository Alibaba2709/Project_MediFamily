import Link from "next/link";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { connectMongo } from "@/app/lib/mongodb";
import { requireVerifiedUser } from "@/app/lib/auth";
import {
  displayFamilyMemberName,
  getFamilyMembers,
  normalizeFamilyMemberNames,
} from "@/app/lib/family";
import { HealthDocument } from "@/app/models/HealthDocument";
import { Visit } from "@/app/models/Visit";
import { DocumentForm } from "@/app/components/DocumentForm";
import { DeleteButton } from "@/app/components/DeleteButton";

type StoredDocument = {
  _id: { toString: () => string };
  memberName: string;
  visitId?: string;
  title: string;
  category: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  paymentDate?: Date;
  amount?: number;
  notes?: string;
  createdAt?: Date;
};

type StoredVisit = {
  _id: { toString: () => string };
  memberName: string;
  title: string;
  visitDate: Date;
};

async function getDocuments(familyId: string) {
  try {
    await connectMongo();

    const documents = await HealthDocument.find({ familyId })
      .sort({ createdAt: -1 })
      .select("-fileData")
      .lean<StoredDocument[]>();

    return documents.map((document) => ({
      id: document._id.toString(),
      memberName: document.memberName,
      visitId: document.visitId,
      title: document.title,
      category: document.category,
      fileName: document.fileName,
      fileType: document.fileType,
      fileSize: document.fileSize,
      paymentDate: document.paymentDate?.toISOString(),
      amount: document.amount,
      notes: document.notes,
      createdAt: document.createdAt?.toISOString(),
    }));
  } catch {
    return [];
  }
}

async function getLinkableVisits(familyId: string) {
  try {
    await connectMongo();

    const visits = await Visit.find({ familyId })
      .sort({ visitDate: -1 })
      .lean<StoredVisit[]>();

    return visits.map((visit) => ({
      id: visit._id.toString(),
      memberName: visit.memberName,
      title: visit.title,
      visitDate: visit.visitDate.toISOString(),
    }));
  } catch {
    return [];
  }
}

function formatBytes(value?: number) {
  if (!value) return "Nessun file";
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(value?: string) {
  if (!value) return "Non impostata";

  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatCurrency(value?: number) {
  if (value === undefined) return "Importo non impostato";

  return new Intl.NumberFormat("it-IT", {
    currency: "EUR",
    style: "currency",
  }).format(value);
}

export default async function DocumentsPage() {
  const user = await requireVerifiedUser();
  const canEdit = user.role !== "viewer";
  const members = await getFamilyMembers(user);
  const documents = await getDocuments(user.familyId);
  const visits = await getLinkableVisits(user.familyId);
  const visibleDocuments = documents.map((document) => ({
    ...document,
    memberName: displayFamilyMemberName(document.memberName, members),
  }));
  const visibleVisits = visits.map((visit) => ({
    ...visit,
    memberName: displayFamilyMemberName(visit.memberName, members),
  }));
  const memberNames = normalizeFamilyMemberNames(
    [
      ...members.map((member) => member.name),
      ...documents.map((document) => document.memberName),
      ...visits.map((visit) => visit.memberName),
    ],
    members
  );
  const visitsById = new Map(visits.map((visit) => [visit.id, visit]));

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
          {canEdit ? (
            <DocumentForm familyMembers={memberNames} visits={visibleVisits} />
          ) : null}
        </div>

        <section className="rounded-lg border border-[#eadfd7] bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-[#fff7f5] text-[#7f5146]">
              <FileText size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#947b6a]">
                Archivio salute
              </p>
              <h1 className="mt-1 text-3xl font-semibold text-[#29302d]">
                Documenti
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6c5f57]">
                Carica e conserva referti, esami, prescrizioni e allegati.
              </p>
            </div>
          </div>
        </section>

        {visibleDocuments.length > 0 ? (
          <section className="grid gap-3">
            {visibleDocuments.map((document) => (
              <article
                className="rounded-lg border border-[#eadfd7] bg-white p-4 shadow-sm"
                key={document.id}
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-[#29302d]">
                        {document.title}
                      </h2>
                      <span className="rounded-md bg-[#fff7f5] px-2 py-1 text-xs font-semibold text-[#7f5146]">
                        {document.category}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[#6c5f57]">
                      {document.memberName}
                    </p>
                    {document.visitId && visitsById.has(document.visitId) ? (
                      <p className="mt-2 rounded-md bg-[#f6fbf7] px-3 py-2 text-sm text-[#315a45]">
                        Collegato a: {visitsById.get(document.visitId)?.title}
                      </p>
                    ) : null}
                    {document.category === "pagamento" ? (
                      <p className="mt-2 rounded-md bg-[#fff7f5] px-3 py-2 text-sm text-[#7f5146]">
                        Pagato il {formatDate(document.paymentDate)} ·{" "}
                        {formatCurrency(document.amount)}
                      </p>
                    ) : null}
                    <p className="mt-3 text-sm text-[#6c5f57]">
                      {document.fileName ?? "Solo scheda senza file"} ·{" "}
                      {formatBytes(document.fileSize)}
                    </p>
                    {document.notes ? (
                      <p className="mt-2 text-sm leading-6 text-[#6c5f57]">
                        {document.notes}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    {canEdit ? (
                      <DocumentForm
                        mode="edit"
                        document={document}
                        familyMembers={memberNames}
                        visits={visibleVisits}
                      />
                    ) : null}
                    {document.fileName ? (
                      <a
                        className="flex h-9 items-center justify-center gap-2 rounded-md border border-[#d5e0d8] bg-[#f6fbf7] px-3 text-sm font-semibold text-[#315a45] transition hover:bg-[#edf6ef]"
                        href={`/api/documents/${document.id}/download`}
                      >
                        <Download size={16} aria-hidden="true" />
                        Scarica
                      </a>
                    ) : null}
                    {canEdit ? (
                      <DeleteButton
                        endpoint={`/api/documents/${document.id}`}
                        label={document.title}
                      />
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="rounded-lg border border-dashed border-[#d9cfc6] bg-white p-6 text-center shadow-sm">
            <FileText size={28} className="mx-auto text-[#947b6a]" aria-hidden="true" />
            <h2 className="mt-3 text-base font-semibold text-[#29302d]">
              Nessun documento caricato
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6c5f57]">
              Premi Documento per caricare il primo file o salvare una scheda.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
