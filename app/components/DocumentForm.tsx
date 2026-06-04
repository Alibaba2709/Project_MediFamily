"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2, PenLine, Plus, X } from "lucide-react";

const fallbackFamilyMembers = ["Utente principale"];

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const initialForm = {
  memberName: fallbackFamilyMembers[0],
  visitId: "",
  title: "",
  category: "referto",
  notes: "",
};

type LinkableVisit = {
  id: string;
  memberName: string;
  title: string;
  visitDate: string;
};

type EditableDocument = {
  id: string;
  memberName: string;
  visitId?: string;
  title: string;
  category: string;
  fileName?: string;
  notes?: string;
};

type DocumentFormProps = {
  mode?: "create" | "edit";
  document?: EditableDocument;
  familyMembers?: string[];
  visits?: LinkableVisit[];
};

function buildInitialForm(
  document?: EditableDocument,
  familyMembers: string[] = fallbackFamilyMembers
) {
  const defaultMember = familyMembers[0] || fallbackFamilyMembers[0];

  if (!document) {
    return {
      ...initialForm,
      memberName: defaultMember,
    };
  }

  return {
    memberName: document.memberName || defaultMember,
    visitId: document.visitId ?? "",
    title: document.title,
    category: document.category,
    notes: document.notes ?? "",
  };
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function DocumentForm({
  mode = "create",
  document,
  familyMembers = fallbackFamilyMembers,
  visits = [],
}: DocumentFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(() =>
    buildInitialForm(document, familyMembers)
  );
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = mode === "edit";
  const matchingVisits = visits.filter(
    (visit) => visit.memberName === form.memberName
  );

  function openForm() {
    setForm(buildInitialForm(document, familyMembers));
    setFile(null);
    setError("");
    setIsOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.title.trim()) {
      setError("Il titolo del documento è obbligatorio.");
      return;
    }

    if (file && file.size > MAX_FILE_SIZE) {
      setError("Il file è troppo grande. Per ora il limite è 2MB.");
      return;
    }

    setIsSaving(true);
    const fileData = file ? await readFileAsDataUrl(file) : undefined;

    const response = await fetch(isEditing && document ? `/api/documents/${document.id}` : "/api/documents", {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        fileName: file?.name,
        fileType: file?.type,
        fileSize: file?.size,
        fileData,
      }),
    });

    setIsSaving(false);

    if (!response.ok) {
      setError(
        isEditing
          ? "Non sono riuscita ad aggiornare il documento. Riprova."
          : "Non sono riuscita a caricare il documento. Riprova."
      );
      return;
    }

    setForm(buildInitialForm(document, familyMembers));
    setFile(null);
    setIsOpen(false);
    router.refresh();
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
        {isEditing ? "Modifica" : "Documento"}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#2f3330]/35 px-4 py-6">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-[#eadfd7] bg-[#fffdfb] shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-[#eadfd7] bg-[#fffdfb] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-[#fff7f5] text-[#7f5146]">
                  <FileUp size={21} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#947b6a]">
                    Archivio salute
                  </p>
                  <h2 className="text-xl font-semibold text-[#29302d]">
                    {isEditing ? "Modifica documento" : "Carica documento"}
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
                        visitId: "",
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
                    Tipo
                  </span>
                  <select
                    className="h-11 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm outline-none focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
                    value={form.category}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        category: event.target.value,
                      }))
                    }
                  >
                    <option value="referto">Referto</option>
                    <option value="esame">Esame</option>
                    <option value="prescrizione">Prescrizione</option>
                    <option value="pagamento">Pagamento</option>
                    <option value="altro">Altro</option>
                  </select>
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-[#4f5c55]">
                  Visita collegata
                </span>
                <select
                  className="h-11 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm outline-none focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
                  value={form.visitId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      visitId: event.target.value,
                    }))
                  }
                >
                  <option value="">Nessuna visita collegata</option>
                  {matchingVisits.map((visit) => (
                    <option key={visit.id} value={visit.id}>
                      {visit.title} · {formatVisitDate(visit.visitDate)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-[#4f5c55]">
                  Titolo
                </span>
                <input
                  className="h-11 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm outline-none placeholder:text-[#a1968e] focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
                  placeholder="Es. Referto analisi sangue"
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-[#4f5c55]">
                  File
                </span>
                <input
                  className="block w-full rounded-md border border-[#ded4cb] bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#f6fbf7] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#315a45]"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
                <p className="text-xs text-[#7a6f68]">
                  {isEditing && document?.fileName
                    ? `File attuale: ${document.fileName}. Puoi sostituirlo caricandone uno nuovo.`
                    : "Per ora puoi caricare PDF o immagini fino a 2MB."}
                </p>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-[#4f5c55]">
                  Note
                </span>
                <textarea
                  className="min-h-24 w-full resize-y rounded-md border border-[#ded4cb] bg-white px-3 py-3 text-sm outline-none placeholder:text-[#a1968e] focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
                  placeholder="Es. Controllo annuale, portare alla prossima visita..."
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
                    <Plus size={17} aria-hidden="true" />
                  )}
                  {isEditing ? "Aggiorna documento" : "Salva documento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function formatVisitDate(value: string) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
