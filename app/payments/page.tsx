import Link from "next/link";
import { ArrowLeft, CreditCard, Download } from "lucide-react";
import { connectMongo } from "@/app/lib/mongodb";
import { requireVerifiedUser } from "@/app/lib/auth";
import { HealthDocument } from "@/app/models/HealthDocument";
import { Visit } from "@/app/models/Visit";
import { PaymentReceiptForm } from "@/app/components/PaymentReceiptForm";
import { DeleteButton } from "@/app/components/DeleteButton";

type StoredVisit = {
  _id: { toString: () => string };
  memberName: string;
  title: string;
  visitDate: Date;
  visitTime?: string;
  price?: number;
  status?: "booked" | "paid" | "cancelled" | "completed";
};

type StoredReceipt = {
  _id: { toString: () => string };
  memberName: string;
  visitId?: string;
  title: string;
  fileName?: string;
  fileSize?: number;
  paymentDate?: Date;
  amount?: number;
  notes?: string;
  createdAt?: Date;
};

async function getPaymentData(familyId: string) {
  try {
    await connectMongo();

    const [visits, receipts] = await Promise.all([
      Visit.find({
        familyId,
        status: { $in: ["booked", "paid", "completed"] },
      })
        .sort({ visitDate: 1, visitTime: 1 })
        .lean<StoredVisit[]>(),
      HealthDocument.find({ familyId, category: "pagamento" })
        .sort({ createdAt: -1 })
        .select("-fileData")
        .lean<StoredReceipt[]>(),
    ]);

    return {
      visits: visits.map((visit) => ({
        id: visit._id.toString(),
        memberName: visit.memberName,
        title: visit.title,
        visitDate: visit.visitDate.toISOString(),
        visitTime: visit.visitTime,
        price: visit.price,
        status: visit.status ?? "booked",
      })),
      receipts: receipts.map((receipt) => ({
        id: receipt._id.toString(),
        memberName: receipt.memberName,
        visitId: receipt.visitId,
        title: receipt.title,
        fileName: receipt.fileName,
        fileSize: receipt.fileSize,
        paymentDate: receipt.paymentDate?.toISOString(),
        amount: receipt.amount,
        notes: receipt.notes,
        createdAt: receipt.createdAt?.toISOString(),
      })),
    };
  } catch {
    return { visits: [], receipts: [] };
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

function formatBytes(value?: number) {
  if (!value) return "Nessun file";
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function formatCurrency(value?: number) {
  if (value === undefined) return "Importo non impostato";

  return new Intl.NumberFormat("it-IT", {
    currency: "EUR",
    style: "currency",
  }).format(value);
}

export default async function PaymentsPage() {
  const user = await requireVerifiedUser();
  const canEdit = user.role !== "viewer";
  const { receipts, visits } = await getPaymentData(user.familyId);
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
          {canEdit ? <PaymentReceiptForm visits={visits} /> : null}
        </div>

        <section className="rounded-lg border border-[#eadfd7] bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-[#fff7f5] text-[#7f5146]">
              <CreditCard size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#947b6a]">
                Archivio salute
              </p>
              <h1 className="mt-1 text-3xl font-semibold text-[#29302d]">
                Pagamenti
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6c5f57]">
                Allega ricevute di ticket o visite e collegale alla prenotazione
                corretta.
              </p>
            </div>
          </div>
        </section>

        {visits.length === 0 ? (
          <section className="rounded-lg border border-dashed border-[#d9cfc6] bg-white p-4 text-sm text-[#6c5f57] shadow-sm">
            Non ci sono visite a cui allegare una ricevuta.
          </section>
        ) : null}

        {receipts.length > 0 ? (
          <section className="grid gap-3">
            {receipts.map((receipt) => {
              const visit = receipt.visitId
                ? visitsById.get(receipt.visitId)
                : undefined;

              return (
                <article
                  className="rounded-lg border border-[#eadfd7] bg-white p-4 shadow-sm"
                  key={receipt.id}
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-[#29302d]">
                          {receipt.title}
                        </h2>
                        <span className="rounded-md bg-[#fff7f5] px-2 py-1 text-xs font-semibold text-[#7f5146]">
                          Ricevuta
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-[#6c5f57]">
                        {receipt.memberName}
                        {visit ? ` · ${visit.title}` : ""}
                      </p>
                      <p className="mt-3 text-sm text-[#6c5f57]">
                        Pagato il {formatDate(receipt.paymentDate)} ·{" "}
                        {formatCurrency(receipt.amount)}
                      </p>
                      <p className="mt-1 text-sm text-[#6c5f57]">
                        {receipt.fileName ?? "Solo scheda senza file"} ·{" "}
                        {formatBytes(receipt.fileSize)}
                      </p>
                      {receipt.notes ? (
                        <p className="mt-2 text-sm leading-6 text-[#6c5f57]">
                          {receipt.notes}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      {receipt.fileName ? (
                        <a
                          className="flex h-9 items-center justify-center gap-2 rounded-md border border-[#d5e0d8] bg-[#f6fbf7] px-3 text-sm font-semibold text-[#315a45] transition hover:bg-[#edf6ef]"
                          href={`/api/documents/${receipt.id}/download`}
                        >
                          <Download size={16} aria-hidden="true" />
                          Scarica
                        </a>
                      ) : null}
                      {canEdit ? (
                        <DeleteButton
                          endpoint={`/api/documents/${receipt.id}`}
                          label={receipt.title}
                        />
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <section className="rounded-lg border border-dashed border-[#d9cfc6] bg-white p-6 text-center shadow-sm">
            <CreditCard
              size={28}
              className="mx-auto text-[#947b6a]"
              aria-hidden="true"
            />
            <h2 className="mt-3 text-base font-semibold text-[#29302d]">
              Nessuna ricevuta allegata
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6c5f57]">
              Premi Ricevuta per collegare il pagamento a una visita.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
