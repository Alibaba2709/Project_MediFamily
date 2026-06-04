import Link from "next/link";
import { ArrowLeft, Pill, Plus } from "lucide-react";

export default function MedicationsPage() {
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
                Qui terremo traccia di farmaci attivi, dosaggi e orari.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-dashed border-[#d9cfc6] bg-white p-6 text-center shadow-sm">
          <Plus size={28} className="mx-auto text-[#947b6a]" aria-hidden="true" />
          <h2 className="mt-3 text-base font-semibold text-[#29302d]">
            Nessun farmaco inserito
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6c5f57]">
            Il prossimo passo sarà creare il form per aggiungere terapia,
            dosaggio e orari.
          </p>
        </section>
      </div>
    </main>
  );
}
