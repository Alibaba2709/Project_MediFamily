"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, FileUp, Loader2, Plus, X } from "lucide-react";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

type PayableVisit = {
  id: string;
  memberName: string;
  title: string;
  visitDate: string;
  visitTime?: string;
  price?: number;
};

type PaymentReceiptFormProps = {
  visits: PayableVisit[];
};

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function formatVisitDate(value: string) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function PaymentReceiptForm({ visits }: PaymentReceiptFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [visitId, setVisitId] = useState(visits[0]?.id ?? "");
  const selectedVisit = visits.find((visit) => visit.id === visitId);
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [amount, setAmount] = useState(selectedVisit?.price?.toString() ?? "");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function openForm() {
    setVisitId(visits[0]?.id ?? "");
    setAmount(visits[0]?.price?.toString() ?? "");
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setNotes("");
    setFile(null);
    setError("");
    setIsOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!visitId) {
      setError("Seleziona una visita.");
      return;
    }

    if (!file) {
      setError("Allega la ricevuta di pagamento.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Il file è troppo grande. Per ora il limite è 2MB.");
      return;
    }

    setIsSaving(true);
    const fileData = await readFileAsDataUrl(file);
    const response = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitId,
        paymentDate,
        amount,
        notes,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileData,
      }),
    });

    setIsSaving(false);

    if (!response.ok) {
      const result = await response.json();
      setError(result.error ?? "Non sono riuscita a salvare la ricevuta.");
      return;
    }

    setIsOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#315a45] px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#274737] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        disabled={visits.length === 0}
        onClick={openForm}
        type="button"
      >
        <Plus size={17} aria-hidden="true" />
        Ricevuta
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#2f3330]/35 px-4 py-6">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-[#eadfd7] bg-[#fffdfb] shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-[#eadfd7] bg-[#fffdfb] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-[#fff7f5] text-[#7f5146]">
                  <CreditCard size={21} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#947b6a]">
                    Pagamenti
                  </p>
                  <h2 className="text-xl font-semibold text-[#29302d]">
                    Allega ricevuta
                  </h2>
                </div>
              </div>
              <button
                aria-label="Chiudi form"
                className="flex size-9 items-center justify-center rounded-md border border-[#e3d7cf] bg-white text-[#5f6862] transition hover:bg-[#f8f1ec]"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <form className="space-y-5 p-5" onSubmit={handleSubmit}>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-[#4f5c55]">
                  Visita collegata
                </span>
                <select
                  className="h-11 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm outline-none focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
                  value={visitId}
                  onChange={(event) => {
                    const nextVisit = visits.find(
                      (visit) => visit.id === event.target.value
                    );
                    setVisitId(event.target.value);
                    setAmount(nextVisit?.price?.toString() ?? "");
                  }}
                >
                  {visits.map((visit) => (
                    <option key={visit.id} value={visit.id}>
                      {visit.memberName} · {visit.title} ·{" "}
                      {formatVisitDate(visit.visitDate)}
                      {visit.visitTime ? ` · ${visit.visitTime}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-[#4f5c55]">
                    Data pagamento
                  </span>
                  <input
                    className="h-11 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm outline-none focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
                    type="date"
                    value={paymentDate}
                    onChange={(event) => setPaymentDate(event.target.value)}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-[#4f5c55]">
                    Importo
                  </span>
                  <input
                    className="h-11 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm outline-none placeholder:text-[#a1968e] focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
                    min="0"
                    placeholder="Es. 36.15"
                    step="0.01"
                    type="number"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                  />
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-[#4f5c55]">
                  Ricevuta
                </span>
                <input
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  className="block w-full rounded-md border border-[#ded4cb] bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#f6fbf7] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#315a45]"
                  type="file"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
                <p className="text-xs text-[#7a6f68]">
                  Puoi allegare PDF o immagini fino a 2MB.
                </p>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-[#4f5c55]">
                  Note
                </span>
                <textarea
                  className="min-h-20 w-full resize-y rounded-md border border-[#ded4cb] bg-white px-3 py-3 text-sm outline-none placeholder:text-[#a1968e] focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
                  placeholder="Es. Pagato online, ricevuta ticket..."
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
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
                    <FileUp size={17} aria-hidden="true" />
                  )}
                  Salva ricevuta
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
