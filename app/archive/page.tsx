import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  CreditCard,
  FileText,
  Pill,
} from "lucide-react";
import { connectMongo } from "@/app/lib/mongodb";
import { requireVerifiedUser } from "@/app/lib/auth";
import { HealthDocument } from "@/app/models/HealthDocument";
import { Medication } from "@/app/models/Medication";
import { Recipe } from "@/app/models/Recipe";

const archiveItems = [
  {
    title: "Documenti",
    detail: "Referti, esami, prescrizioni e allegati",
    href: "/documents",
    icon: FileText,
    tone: "bg-[#fff7f5] text-[#7f5146]",
    key: "documents",
  },
  {
    title: "Ricette",
    detail: "Codici ricetta e rinnovi",
    href: "/recipes",
    icon: ClipboardList,
    tone: "bg-[#faf7ff] text-[#5d527b]",
    key: "recipes",
  },
  {
    title: "Farmaci",
    detail: "Terapie, dosaggi e orari",
    href: "/medications",
    icon: Pill,
    tone: "bg-[#f6fbf7] text-[#315a45]",
    key: "medications",
  },
  {
    title: "Pagamenti",
    detail: "Ricevute ticket e visite",
    href: "/payments",
    icon: CreditCard,
    tone: "bg-[#fff7f5] text-[#7f5146]",
    key: "payments",
  },
];

async function getArchiveCounts(familyId: string) {
  await connectMongo();

  const [documents, recipes, medications, payments] = await Promise.all([
    HealthDocument.countDocuments({ familyId, category: { $ne: "pagamento" } }),
    Recipe.countDocuments({ familyId }),
    Medication.countDocuments({ familyId }),
    HealthDocument.countDocuments({ familyId, category: "pagamento" }),
  ]);

  return {
    documents,
    recipes,
    medications,
    payments,
  };
}

export default async function ArchivePage() {
  const user = await requireVerifiedUser();
  const counts = await getArchiveCounts(user.familyId);

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
            <div className="flex size-11 items-center justify-center rounded-lg bg-[#fff7f5] text-[#7f5146]">
              <FileText size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#947b6a]">
                Archivio salute
              </p>
              <h1 className="mt-1 text-3xl font-semibold text-[#29302d]">
                Tutti i contenuti salvati
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6c5f57]">
                Apri documenti, ricette, farmaci e ricevute da un unico punto.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          {archiveItems.map((item) => {
            const Icon = item.icon;
            const count = counts[item.key as keyof typeof counts];

            return (
              <Link
                className="group rounded-lg border border-[#eadfd7] bg-white p-4 shadow-sm transition hover:border-[#d5e0d8] hover:bg-[#fffdfb]"
                href={item.href}
                key={item.href}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex items-start gap-3">
                    <span
                      className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${item.tone}`}
                    >
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block font-semibold text-[#29302d]">
                        {item.title}
                      </span>
                      <span className="mt-1 block text-sm leading-6 text-[#6c5f57]">
                        {item.detail}
                      </span>
                      <span className="mt-3 inline-flex rounded-md bg-[#fffaf6] px-2 py-1 text-xs font-semibold text-[#4f5c55]">
                        {count === 1 ? "1 elemento" : `${count} elementi`}
                      </span>
                    </span>
                  </span>
                  <ArrowRight
                    size={17}
                    className="mt-1 shrink-0 text-[#789888] transition group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}
