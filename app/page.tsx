import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock3,
  CreditCard,
  ExternalLink,
  FileText,
  Pill,
  Settings,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";
import { redirect } from "next/navigation";
import { connectMongo } from "@/app/lib/mongodb";
import { getCurrentUser } from "@/app/lib/auth";
import { Visit } from "@/app/models/Visit";
import { Recipe } from "@/app/models/Recipe";
import { Medication } from "@/app/models/Medication";
import { HealthDocument } from "@/app/models/HealthDocument";
import { VisitForm } from "@/app/components/VisitForm";
import { LogoutButton } from "@/app/components/LogoutButton";
import { AddFamilyMemberForm } from "@/app/components/AddFamilyMemberForm";
import { CancelVisitButton } from "@/app/components/CancelVisitButton";
import { GlobalSearch } from "@/app/components/GlobalSearch";
import { MemberAvatar } from "@/app/components/MemberAvatar";
import { ProfileImageControl } from "@/app/components/ProfileImageControl";
import { OnboardingAssistant } from "@/app/components/OnboardingAssistant";
import type { SearchItem } from "@/app/components/GlobalSearch";
import {
  displayFamilyMemberName,
  getFamilyBookingSettings,
  getFamilyMembers,
  memberSlug,
  normalizeFamilyMemberNames,
} from "@/app/lib/family";
import {
  getMedicationTimes,
  isMedicationDueOnDate,
  medicationTimeSortValue,
} from "@/app/lib/medications";

type DashboardVisit = {
  id: string;
  memberName: string;
  title: string;
  doctor?: string;
  location?: string;
  visitDate: string;
  visitTime?: string;
  paymentDueDate?: string;
  cancellationDueDate?: string;
  price?: number;
  notes?: string;
  status: "booked" | "paid" | "cancelled" | "completed";
};

type StoredVisit = {
  _id: { toString: () => string };
  memberName: string;
  title: string;
  doctor?: string;
  location?: string;
  visitDate: Date;
  visitTime?: string;
  paymentDueDate?: Date;
  cancellationDueDate?: Date;
  price?: number;
  notes?: string;
  status?: DashboardVisit["status"];
};

type DashboardRecipe = {
  id: string;
  memberName: string;
  medicationName: string;
  recipeCode?: string;
  doctor?: string;
  renewalDate?: string;
  notes?: string;
};

type StoredRecipe = {
  _id: { toString: () => string };
  memberName: string;
  medicationName: string;
  recipeCode?: string;
  doctor?: string;
  renewalDate?: Date;
  notes?: string;
};

type DashboardMedication = {
  id: string;
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
  startDate?: string;
  endDate?: string;
  active: boolean;
  notes?: string;
};

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

type DashboardDocument = {
  id: string;
  memberName: string;
  visitId?: string;
  title: string;
  category: string;
  fileName?: string;
  paymentDate?: string;
  amount?: number;
  notes?: string;
  createdAt?: string;
};

type StoredDocument = {
  _id: { toString: () => string };
  memberName: string;
  visitId?: string;
  title: string;
  category: string;
  fileName?: string;
  paymentDate?: Date;
  amount?: number;
  notes?: string;
  createdAt?: Date;
};

type UrgencyItem = {
  date: string;
  title: string;
  detail: string;
  tone: string;
  href: string;
};

function visitDateTime(value: string, visitTime?: string) {
  const date = new Date(value);
  const [hours, minutes] = (visitTime ?? "").split(":").map(Number);

  if (Number.isFinite(hours) && Number.isFinite(minutes)) {
    date.setHours(hours, minutes, 0, 0);
  } else {
    date.setHours(23, 59, 59, 999);
  }

  return date;
}

function effectiveVisitStatus(
  status: DashboardVisit["status"],
  visitDate: string,
  visitTime?: string
): DashboardVisit["status"] {
  if (status === "cancelled" || status === "completed") return status;

  if (visitDateTime(visitDate, visitTime) < new Date()) {
    return "completed";
  }

  return status;
}

const healthArchiveLinks = [
  {
    title: "Documenti",
    detail: "Referti, esami e allegati",
    href: "/documents",
    icon: FileText,
    tone: "bg-[#fff7f5] text-[#7f5146]",
  },
  {
    title: "Ricette",
    detail: "Promemoria e rinnovi",
    href: "/recipes",
    icon: ClipboardList,
    tone: "bg-[#faf7ff] text-[#5d527b]",
  },
  {
    title: "Farmaci",
    detail: "Terapie e dosaggi",
    href: "/medications",
    icon: Pill,
    tone: "bg-[#f6fbf7] text-[#315a45]",
  },
  {
    title: "Pagamenti",
    detail: "Ricevute e ticket",
    href: "/payments",
    icon: CreditCard,
    tone: "bg-[#fff7f5] text-[#7f5146]",
  },
];

async function getVisits(familyId: string): Promise<DashboardVisit[]> {
  try {
    await connectMongo();

    const visits = await Visit.find({ familyId })
      .sort({ visitDate: 1 })
      .lean<StoredVisit[]>();
    const completedVisitIds = visits
      .filter((visit) => {
        const status = visit.status ?? "booked";

        return (
          status !== "completed" &&
          status !== "cancelled" &&
          effectiveVisitStatus(
            status,
            visit.visitDate.toISOString(),
            visit.visitTime
          ) === "completed"
        );
      })
      .map((visit) => visit._id);

    if (completedVisitIds.length > 0) {
      await Visit.updateMany(
        { _id: { $in: completedVisitIds }, familyId },
        { $set: { status: "completed" } }
      );
    }

    return visits.map((visit) => {
      const visitDate = visit.visitDate.toISOString();
      const status = visit.status ?? "booked";

      return {
        id: visit._id.toString(),
        memberName: visit.memberName,
        title: visit.title,
        doctor: visit.doctor,
        location: visit.location,
        visitDate,
        visitTime: visit.visitTime,
        paymentDueDate: visit.paymentDueDate?.toISOString(),
        cancellationDueDate: visit.cancellationDueDate?.toISOString(),
        price: visit.price,
        notes: visit.notes,
        status: effectiveVisitStatus(status, visitDate, visit.visitTime),
      };
    });
  } catch {
    return [];
  }
}

async function getRecipes(familyId: string): Promise<DashboardRecipe[]> {
  try {
    await connectMongo();

    const recipes = await Recipe.find({ familyId })
      .sort({ renewalDate: 1 })
      .lean<StoredRecipe[]>();

    return recipes.map((recipe) => ({
      id: recipe._id.toString(),
      memberName: recipe.memberName,
      medicationName: recipe.medicationName,
      recipeCode: recipe.recipeCode,
      doctor: recipe.doctor,
      renewalDate: recipe.renewalDate?.toISOString(),
      notes: recipe.notes,
    }));
  } catch {
    return [];
  }
}

async function getMedications(
  familyId: string
): Promise<DashboardMedication[]> {
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

async function getDocuments(familyId: string): Promise<DashboardDocument[]> {
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
      paymentDate: document.paymentDate?.toISOString(),
      amount: document.amount,
      notes: document.notes,
      createdAt: document.createdAt?.toISOString(),
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

function statusLabel(status: DashboardVisit["status"]) {
  const labels = {
    booked: "Prenotata",
    paid: "Pagata",
    cancelled: "Annullata",
    completed: "Effettuata",
  };

  return labels[status];
}

function statusTone(status: DashboardVisit["status"]) {
  const tones = {
    booked: "bg-[#f7e2bf] text-[#7a5b2f]",
    paid: "bg-[#d9eadf] text-[#315a45]",
    cancelled: "bg-[#fff7f5] text-[#9f4d46]",
    completed: "bg-[#d9eadf] text-[#315a45]",
  };

  return tones[status];
}

function toStartOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function isWithinDays(value: string, days: number) {
  const today = toStartOfDay(new Date());
  const limit = new Date(today);
  limit.setDate(limit.getDate() + days);
  const date = toStartOfDay(new Date(value));

  return date >= today && date <= limit;
}

function todayAtTime(value?: string) {
  const date = new Date();
  const [hours, minutes] = (value ?? "").split(":").map(Number);

  if (Number.isFinite(hours) && Number.isFinite(minutes)) {
    date.setHours(hours, minutes, 0, 0);
  }

  return date.toISOString();
}

function buildUrgencyItems(
  visits: DashboardVisit[],
  recipes: DashboardRecipe[],
  medications: DashboardMedication[]
): UrgencyItem[] {
  const visitItems = visits.flatMap((visit) => {
    const items: UrgencyItem[] = [];

    if (visit.status === "booked" && isWithinDays(visit.visitDate, 7)) {
      items.push({
        date: visit.visitDate,
        title: "Visita in arrivo",
        detail: `${visit.memberName} · ${visit.title}${
          visit.visitTime ? ` · ${visit.visitTime}` : ""
        }`,
        tone: "border-[#d5e0d8] bg-[#f6fbf7]",
        href: "/calendar",
      });
    }

    if (
      visit.status === "booked" &&
      visit.paymentDueDate &&
      isWithinDays(visit.paymentDueDate, 7)
    ) {
      items.push({
        date: visit.paymentDueDate,
        title: "Pagamento da fare",
        detail: `${visit.memberName} · ${visit.title}`,
        tone: "border-[#f1d8cf] bg-[#fff7f5]",
        href: "/reminders",
      });
    }

    if (
      visit.status === "booked" &&
      visit.cancellationDueDate &&
      isWithinDays(visit.cancellationDueDate, 7)
    ) {
      items.push({
        date: visit.cancellationDueDate,
        title: "Ultimo giorno per disdire",
        detail: `${visit.memberName} · ${visit.title}`,
        tone: "border-[#f0d3a6] bg-[#fff8e9]",
        href: "/reminders",
      });
    }

    return items;
  });

  const recipeItems = recipes
    .filter(
      (recipe) => recipe.renewalDate && isWithinDays(recipe.renewalDate, 7)
    )
    .map((recipe) => ({
      date: recipe.renewalDate as string,
      title: "Ricetta da rinnovare",
      detail: `${recipe.memberName} · ${recipe.medicationName}`,
      tone: "border-[#d7d0ec] bg-[#faf7ff]",
      href: "/recipes",
    }));

  const medicationItems = medications
    .filter((medication) => medication.active && medication.endDate)
    .filter((medication) => isWithinDays(medication.endDate as string, 7))
    .map((medication) => ({
      date: medication.endDate as string,
      title: "Fine terapia",
      detail: `${medication.memberName} · ${medication.name} · ${formatDate(
        medication.endDate
      )}`,
      tone: "border-[#f0d3a6] bg-[#fff8e9]",
      href: `/medications#medication-${medication.id}`,
    }));

  const activeMedicationItems = medications
    .filter(
      (medication) =>
        isMedicationDueOnDate(medication) &&
        medication.active &&
        (!medication.endDate || !isWithinDays(medication.endDate, 7))
    )
    .sort((a, b) =>
      medicationTimeSortValue(getMedicationTimes(a)[0]).localeCompare(
        medicationTimeSortValue(getMedicationTimes(b)[0])
      )
    )
    .slice(0, 3)
    .flatMap((medication) =>
      getMedicationTimes(medication).map((time) => ({
        date: todayAtTime(time),
        title: "Terapia attiva",
        detail: `${medication.memberName} · ${medication.name} · ${time}${
          medication.schedule ? ` · ${medication.schedule}` : ""
        }`,
        tone: "border-[#d5e0d8] bg-[#f6fbf7]",
        href: `/medications#medication-${medication.id}`,
      }))
    );

  const lowStockItems = medications
    .filter(
      (medication) =>
        medication.active &&
        medication.stockQuantity !== undefined &&
        medication.lowStockThreshold !== undefined &&
        medication.stockQuantity <= medication.lowStockThreshold
    )
    .map((medication) => ({
      date: new Date().toISOString(),
      title: "Scorta farmaco bassa",
      detail: `${medication.memberName} · ${medication.name} · ${medication.stockQuantity} ${
        medication.stockUnit || "dosi"
      } rimaste`,
      tone: "border-[#f1d8cf] bg-[#fff7f5]",
      href: `/medications#medication-${medication.id}`,
    }));

  return [
    ...visitItems,
    ...recipeItems,
    ...medicationItems,
    ...activeMedicationItems,
    ...lowStockItems,
  ]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 6);
}

function groupVisitsByMember(
  visits: DashboardVisit[],
  members: Awaited<ReturnType<typeof getFamilyMembers>>
) {
  const knownMemberNames = new Set(members.map((member) => member.name));
  const memberGroups = members.map((member) => ({
    ...member,
    visits: visits.filter((visit) => visit.memberName === member.name),
  }));
  const savedOnlyNames = Array.from(
    new Set(
      visits
        .map((visit) => visit.memberName)
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
      visits: visits.filter((visit) => visit.memberName === name),
    })),
  ];
}

function buildSearchItems(
  visits: DashboardVisit[],
  recipes: DashboardRecipe[],
  medications: DashboardMedication[],
  documents: DashboardDocument[]
): SearchItem[] {
  const visitItems = visits.map((visit) => ({
    id: visit.id,
    type: "Visita" as const,
    title: visit.title,
    detail: `${formatDate(visit.visitDate)} · ${
      visit.location ?? "Luogo non impostato"
    }`,
    memberName: visit.memberName,
    href: "/calendar",
    searchText: [
      visit.memberName,
      visit.title,
      visit.doctor,
      visit.location,
      visit.notes,
      statusLabel(visit.status),
    ]
      .filter(Boolean)
      .join(" "),
  }));

  const recipeItems = recipes.map((recipe) => ({
    id: recipe.id,
    type: "Ricetta" as const,
    title: recipe.medicationName,
    detail: `Codice: ${recipe.recipeCode || "non impostato"}`,
    memberName: recipe.memberName,
    href: "/recipes",
    searchText: [
      recipe.memberName,
      recipe.medicationName,
      recipe.recipeCode,
      recipe.doctor,
      recipe.notes,
    ]
      .filter(Boolean)
      .join(" "),
  }));

  const medicationItems = medications.map((medication) => ({
    id: medication.id,
    type: "Farmaco" as const,
    title: medication.name,
    detail: `${medication.dosage || "Dosaggio non impostato"} · ${
      getMedicationTimes(medication).join(", ") || "Orario non impostato"
    }`,
    memberName: medication.memberName,
    href: `/medications#medication-${medication.id}`,
    searchText: [
      medication.memberName,
      medication.name,
      medication.dosage,
      medication.stockQuantity?.toString(),
      medication.stockUnit,
      medication.lowStockThreshold?.toString(),
      medication.intakeTime,
      medication.intakeTimes?.join(" "),
      medication.schedule,
      medication.startDate,
      medication.endDate,
      medication.notes,
    ]
      .filter(Boolean)
      .join(" "),
  }));

  const documentItems = documents.map((document) => ({
    id: document.id,
    type: "Documento" as const,
    title: document.title,
    detail: `${document.category} · ${
      document.fileName ?? "scheda senza file"
    }`,
    memberName: document.memberName,
    href: "/documents",
    searchText: [
      document.memberName,
      document.title,
      document.category,
      document.fileName,
      document.paymentDate,
      document.amount?.toString(),
      document.notes,
    ]
      .filter(Boolean)
      .join(" "),
  }));

  return [...visitItems, ...recipeItems, ...medicationItems, ...documentItems];
}

function PublicHome() {
  const features = [
    {
      icon: CalendarDays,
      title: "Visite",
      text: "date, orari, ticket e disdette",
    },
    {
      icon: Pill,
      title: "Terapie",
      text: "farmaci, dosi e scorte",
    },
    {
      icon: FileText,
      title: "Archivio",
      text: "ricette, ricevute e referti",
    },
  ];
  const family = [
    { name: "Rossana", role: "utente principale", tone: "bg-[#f9d8d6]" },
    { name: "Modesta", role: "mamma", tone: "bg-[#d9eadf]" },
    { name: "Francesco", role: "familiare", tone: "bg-[#dbe7fb]" },
    { name: "Isabella", role: "sorella", tone: "bg-[#f7e2bf]" },
  ];
  const previewItems = [
    {
      icon: CalendarDays,
      title: "Visita cardiologica",
      detail: "Ticket entro venerdi",
      status: "Prenotata",
    },
    {
      icon: Pill,
      title: "Terapia serale",
      detail: "2 dosi da confermare",
      status: "Oggi",
    },
    {
      icon: FileText,
      title: "Ricetta Slowmet",
      detail: "Rinnovo da controllare",
      status: "Promemoria",
    },
  ];

  return (
    <main className="min-h-screen bg-[#fffaf6] px-5 py-5 text-[#2f3330] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4 py-3">
          <Link
            aria-label="MediFamily"
            className="inline-flex items-center gap-3"
            href="/"
          >
            <Image
              src="/medifamily-logo-symbol.png"
              alt=""
              width={760}
              height={650}
              priority
              className="h-12 w-auto object-contain sm:h-14"
            />
            <span>
              <span
                className="block text-xl font-bold leading-tight text-[#5573ad] sm:text-2xl"
                style={{
                  fontFamily:
                    '"Arial Rounded MT Bold", "Avenir Next Rounded", var(--font-geist-sans), sans-serif',
                }}
              >
                Med
                <span className="relative inline-block pr-0.5">
                  ı
                  <span
                    className="absolute -top-1 left-1/2 -translate-x-1/2 text-xs leading-none text-[#ef8580]"
                    aria-hidden="true"
                  >
                    ♥
                  </span>
                </span>
                <span className="text-[#82c79b]">Family</span>
              </span>
              <span className="block text-xs font-semibold uppercase tracking-[0.18em]">
                <span className="text-[#82c79b]">La salute</span>{" "}
                <span className="text-[#8fa4d8]">di chi ami,</span>{" "}
                <span className="text-[#ef8580]">organizzata.</span>
              </span>
            </span>
          </Link>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md border border-[#e3d7cf] bg-white px-4 text-sm font-semibold text-[#315a45] shadow-sm transition hover:bg-[#f8f1ec]"
            href="/auth/login"
          >
            Accedi
          </Link>
        </header>

        <section className="grid min-h-[calc(100vh-6rem)] items-center gap-10 py-8 lg:grid-cols-[0.92fr_1.08fr] lg:py-10">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex rounded-md border border-[#eadfd7] bg-white px-3 py-1 text-sm font-semibold text-[#947b6a] shadow-sm">
                Family mode
              </span>
              <span className="inline-flex rounded-md bg-[#f6fbf7] px-3 py-1 text-sm font-semibold text-[#315a45]">
                Per visite, terapie e documenti
              </span>
            </div>
            <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-[1.05] text-[#29302d] sm:text-6xl">
              Un posto solo per la salute della famiglia.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#6c5f57] sm:text-lg">
              MediFamily organizza scadenze, farmaci e documenti per ogni
              familiare, con una dashboard privata pensata per essere letta in
              pochi secondi.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#315a45] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#274737]"
                href="/auth/register"
              >
                Crea il tuo nucleo
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
              {["Profili separati", "Promemoria chiari", "Archivio privato"].map(
                (item) => (
                  <div
                    className="flex items-center gap-2 border-t border-[#eadfd7] pt-3 text-sm font-medium text-[#4f5c55]"
                    key={item}
                  >
                    <CheckCircle2
                      size={16}
                      className="shrink-0 text-[#6e9d7d]"
                      aria-hidden="true"
                    />
                    {item}
                  </div>
                )
              )}
            </div>
          </div>

          <div className="mx-auto w-full max-w-xl">
            <div className="overflow-hidden rounded-lg border border-[#eadfd7] bg-white shadow-sm">
              <div className="flex h-11 items-center justify-between border-b border-[#eee5dd] bg-[#fffdfb] px-4">
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-[#ef8580]" />
                  <span className="size-2.5 rounded-full bg-[#f4cb66]" />
                  <span className="size-2.5 rounded-full bg-[#82c79b]" />
                </div>
                <span className="text-xs font-semibold uppercase text-[#947b6a]">
                  MediFamily dashboard
                </span>
              </div>

              <div className="grid min-h-[360px] sm:grid-cols-[0.8fr_1.2fr]">
                <aside className="border-b border-[#eee5dd] bg-[#fffaf6] p-4 sm:border-b-0 sm:border-r">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#29302d]">
                      Nucleo
                    </p>
                    <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-[#315a45]">
                      4
                    </span>
                  </div>
                  <div className="space-y-2">
                    {family.map((member) => (
                      <div
                        className="flex items-center gap-2 rounded-md bg-white px-2 py-2"
                        key={member.name}
                      >
                        <span
                          className={`flex size-8 items-center justify-center rounded-md text-sm font-semibold text-[#29302d] ${member.tone}`}
                        >
                          {member.name[0]}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-[#29302d]">
                            {member.name}
                          </span>
                          <span className="block truncate text-xs text-[#7a6f68]">
                            {member.role}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </aside>

                <div className="p-4">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#29302d]">
                        Oggi
                      </p>
                      <p className="text-xs text-[#7a6f68]">
                        Prossimi promemoria
                      </p>
                    </div>
                    <span className="rounded-md bg-[#f6fbf7] px-2 py-1 text-xs font-semibold text-[#315a45]">
                      In ordine
                    </span>
                  </div>

                  <div className="divide-y divide-[#eee5dd] rounded-md border border-[#eee5dd]">
                    {previewItems.map((item) => {
                      const Icon = item.icon;

                      return (
                        <div
                          className="grid grid-cols-[auto_1fr_auto] items-center gap-3 p-3"
                          key={item.title}
                        >
                          <span className="flex size-9 items-center justify-center rounded-md bg-[#f6fbf7] text-[#315a45]">
                            <Icon size={17} aria-hidden="true" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-[#29302d]">
                              {item.title}
                            </span>
                            <span className="block truncate text-xs text-[#6c5f57]">
                              {item.detail}
                            </span>
                          </span>
                          <span className="rounded-md bg-[#fffaf6] px-2 py-1 text-xs font-semibold text-[#7a6f68]">
                            {item.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    {[
                      ["3", "visite"],
                      ["2", "terapie"],
                      ["8", "documenti"],
                    ].map(([value, label]) => (
                      <div
                        className="rounded-md border border-[#eee5dd] px-2 py-3"
                        key={label}
                      >
                        <p className="text-lg font-semibold text-[#29302d]">
                          {value}
                        </p>
                        <p className="text-xs text-[#7a6f68]">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        <section className="grid gap-4 border-t border-[#eadfd7] py-7 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article className="flex gap-3" key={feature.title}>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-white text-[#315a45] shadow-sm">
                  <Icon size={19} aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-[#29302d]">
                    {feature.title}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-[#6c5f57]">
                    {feature.text}
                  </p>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) return <PublicHome />;
  if (!user.emailVerifiedAt) redirect("/verify-email/sent");

  const canEdit = user.role !== "viewer";
  const [members, bookingSettings, visits, recipes, medications, documents] =
    await Promise.all([
      getFamilyMembers(user),
      getFamilyBookingSettings(user),
      getVisits(user.familyId),
      getRecipes(user.familyId),
      getMedications(user.familyId),
      getDocuments(user.familyId),
    ]);
  const visibleVisits = visits.map((visit) => ({
    ...visit,
    memberName: displayFamilyMemberName(visit.memberName, members),
  }));
  const visibleRecipes = recipes.map((recipe) => ({
    ...recipe,
    memberName: displayFamilyMemberName(recipe.memberName, members),
  }));
  const visibleMedications = medications.map((medication) => ({
    ...medication,
    memberName: displayFamilyMemberName(medication.memberName, members),
  }));
  const visibleDocuments = documents.map((document) => ({
    ...document,
    memberName: displayFamilyMemberName(document.memberName, members),
  }));
  const memberNames = Array.from(
    new Set(normalizeFamilyMemberNames([
      ...members.map((member) => member.name),
      ...visits.map((visit) => visit.memberName),
      ...recipes.map((recipe) => recipe.memberName),
      ...medications.map((medication) => medication.memberName),
      ...documents.map((document) => document.memberName),
    ], members))
  ).filter(Boolean);
  const documentsByVisitId = new Map<string, DashboardDocument[]>();
  visibleDocuments.forEach((document) => {
    if (!document.visitId) return;
    documentsByVisitId.set(document.visitId, [
      ...(documentsByVisitId.get(document.visitId) ?? []),
      document,
    ]);
  });
  const visitGroups = groupVisitsByMember(visibleVisits, members);
  const urgencyItems = buildUrgencyItems(
    visibleVisits,
    visibleRecipes,
    visibleMedications
  );
  const searchItems = buildSearchItems(
    visibleVisits,
    visibleRecipes,
    visibleMedications,
    visibleDocuments
  );
  const paymentCount = visits.filter(
    (visit) => visit.status === "booked" && visit.paymentDueDate
  ).length;
  const cancellationCount = visits.filter(
    (visit) => visit.status === "booked" && visit.cancellationDueDate
  ).length;
  const summaryCards = [
    {
      title: "Visite salvate",
      detail:
        visits.length === 1
          ? "1 visita in agenda"
          : `${visits.length} visite in agenda`,
      icon: CalendarDays,
      tone: "border-[#d5e0d8] bg-[#f6fbf7]",
    },
    {
      title: "Pagamenti",
      detail:
        paymentCount === 1
          ? "1 scadenza impostata"
          : `${paymentCount} scadenze impostate`,
      icon: CreditCard,
      tone: "border-[#edc9c3] bg-[#fff7f5]",
    },
    {
      title: "Disdette",
      detail:
        cancellationCount === 1
          ? "1 termine impostato"
          : `${cancellationCount} termini impostati`,
      icon: Clock3,
      tone: "border-[#d7d0ec] bg-[#faf7ff]",
    },
  ];

  return (
    <main className="min-h-screen bg-[#fffaf6] text-[#2f3330]">
      <OnboardingAssistant />
      <header className="border-b border-[#eadfd7] bg-[#fffdfb]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-2.5 sm:gap-3 sm:px-8 sm:py-3">
          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Image
              src="/medifamily-logo-symbol.png"
              alt="MediFamily"
              width={760}
              height={650}
              priority
              className="h-11 w-auto shrink-0 object-contain sm:h-16"
            />
            <span className="min-w-0">
              <span
                className="block text-lg font-bold leading-tight text-[#5573ad] sm:text-2xl"
                style={{
                  fontFamily:
                    '"Arial Rounded MT Bold", "Avenir Next Rounded", var(--font-geist-sans), sans-serif',
                }}
              >
                Med
                <span className="relative inline-block pr-0.5 text-[#5573ad]">
                  ı
                  <span
                    className="absolute -top-1 left-1/2 -translate-x-1/2 text-[10px] leading-none text-[#ef8580] sm:text-xs"
                    aria-hidden="true"
                  >
                    ♥
                  </span>
                </span>
                <span className="text-[#82c79b]">Family</span>
              </span>
              <span className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] min-[390px]:block sm:text-xs">
                <span className="text-[#82c79b]">La salute</span>{" "}
                <span className="text-[#8fa4d8]">di chi ami,</span>{" "}
                <span className="text-[#ef8580]">organizzata.</span>
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              className="hidden h-10 items-center gap-2 rounded-md border border-[#e3d7cf] bg-white px-3 text-sm font-medium text-[#4f5c55] shadow-sm transition hover:bg-[#f8f1ec] md:flex"
              href="/reminders"
            >
              <Bell size={17} aria-hidden="true" />
              <span className="hidden min-[390px]:inline">Promemoria</span>
            </Link>
            {canEdit ? <VisitForm familyMembers={memberNames} /> : null}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 sm:gap-6 sm:px-8 sm:py-6 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-3 sm:space-y-4">
          <details className="group rounded-lg border border-[#eadfd7] bg-white p-3 shadow-sm sm:p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
              <span className="flex min-w-0 items-center gap-3">
                <MemberAvatar
                  className="size-9 sm:size-10"
                  imageDataUrl={
                    members.find(
                      (member) =>
                        member.name.toLowerCase() === user.name.toLowerCase()
                    )?.imageDataUrl
                  }
                  name={user.name}
                  tone="bg-[#f9d8d6]"
                />
                <span className="min-w-0">
                  <span className="block text-xs font-semibold uppercase text-[#7a6f68]">
                    Nucleo familiare
                  </span>
                  <span className="block truncate text-sm font-semibold text-[#313a35]">
                    {user.name}
                  </span>
                </span>
              </span>
              <ChevronDown
                size={18}
                className="shrink-0 text-[#789888] transition group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>

            <div className="mt-4 border-t border-[#eee5dd] pt-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-[#7a6f68]">
                <Users size={15} aria-hidden="true" />
                Membri
              </div>
              <div className="space-y-2">
                {members.map((member) => {
                  const canEditPhoto =
                    user.role === "owner" ||
                    member.name.toLowerCase() === user.name.toLowerCase();

                  return (
                    <div
                      className="flex items-center gap-3 rounded-md p-1 transition hover:bg-[#fffaf6]"
                      key={member.name}
                    >
                      {canEditPhoto ? (
                        <ProfileImageControl
                          avatarClassName="size-9"
                          compact
                          hasImage={Boolean(member.imageDataUrl)}
                          imageDataUrl={member.imageDataUrl}
                          memberName={member.name}
                          mode="avatar"
                          name={member.name}
                          tone={member.tone}
                        />
                      ) : (
                        <MemberAvatar
                          imageDataUrl={member.imageDataUrl}
                          name={member.name}
                          tone={member.tone}
                        />
                      )}
                      <Link
                        className="min-w-0 flex-1"
                        href={`/members/${memberSlug(member.name)}`}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#313a35]">
                            {member.name}
                          </p>
                          <p className="truncate text-xs text-[#7a6f68]">
                            {member.role}
                          </p>
                        </div>
                      </Link>
                    </div>
                  );
                })}
                <AddFamilyMemberForm
                  compact
                  currentCount={members.length}
                  limit={6}
                />
              </div>

              <div className="mt-3 border-t border-[#eee5dd] pt-3 sm:mt-4">
                <p className="mb-2 text-xs font-semibold uppercase text-[#7a6f68]">
                  Impostazioni
                </p>
                <div className="grid gap-2">
                  <Link
                    className="flex h-10 items-center gap-2 rounded-md border border-[#e3d7cf] bg-white px-3 text-sm font-semibold text-[#4f5c55] transition hover:bg-[#f8f1ec]"
                    href="/settings"
                  >
                    <Settings size={16} aria-hidden="true" />
                    Impostazioni
                  </Link>
                  {bookingSettings.portalUrl ? (
                    <a
                      className="flex min-h-10 items-center gap-2 rounded-md border border-[#d5e0d8] bg-[#f6fbf7] px-3 py-2 text-sm font-semibold text-[#315a45] transition hover:bg-[#edf6ef]"
                      href={bookingSettings.portalUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <ExternalLink
                        className="shrink-0"
                        size={16}
                        aria-hidden="true"
                      />
                      <span className="min-w-0">
                        <span className="block">Gestione prenotazioni</span>
                        <span className="block truncate text-xs font-medium text-[#5e6b63]">
                          {bookingSettings.portalName}
                          {bookingSettings.region
                            ? ` · ${bookingSettings.region}`
                            : ""}
                        </span>
                      </span>
                    </a>
                  ) : null}
                  <LogoutButton className="flex h-10 w-full items-center gap-2 rounded-md border border-[#f1d8cf] bg-[#fff7f5] px-3 text-sm font-semibold text-[#9f4d46] transition hover:bg-[#fdece8]" />
                </div>
              </div>
            </div>
          </details>

          <section className="hidden rounded-lg border border-[#d8e5dd] bg-[#f6fbf7] p-4 shadow-sm sm:block">
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={22}
                className="mt-0.5 text-[#4d7c63]"
                aria-hidden="true"
              />
              <div>
                <h2 className="text-sm font-semibold text-[#315a45]">
                  Family mode attiva
                </h2>
                <p className="mt-1 text-sm leading-6 text-[#5e6b63]">
                  Una dashboard condivisa per visite, scadenze e documenti.
                </p>
              </div>
            </div>
          </section>
        </aside>

        <div className="space-y-4 sm:space-y-6">
          <GlobalSearch items={searchItems} />

          <section className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
            <div className="rounded-lg border border-[#eadfd7] bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-start justify-between gap-3 sm:mb-5">
                <div>
                  <p className="text-xs font-semibold uppercase text-[#947b6a] sm:text-sm sm:normal-case">
                    Dati aggiornati
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-[#29302d] sm:text-3xl">
                    Agenda e scadenze
                  </h2>
                </div>
                <div className="rounded-md border border-[#f1d8cf] bg-[#fff7f5] px-2 py-1 text-xs font-semibold text-[#7f5146] sm:px-3 sm:py-2 sm:text-sm sm:font-normal">
                  Dati reali
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {summaryCards.map((card) => {
                  const Icon = card.icon;

                  return (
                    <article
                      className={`rounded-lg border p-3 sm:p-4 ${card.tone}`}
                      key={card.title}
                    >
                      <Icon
                        size={18}
                        className="mb-2 text-[#4f5c55] sm:mb-3"
                        aria-hidden="true"
                      />
                      <h3 className="text-xs font-semibold text-[#313a35] sm:text-sm">
                        {card.title}
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-[#6c5f57] sm:mt-2 sm:text-sm sm:leading-6">
                        {card.detail}
                      </p>
                    </article>
                  );
                })}
              </div>

              <div className="mt-4 rounded-lg border border-[#eee5dd] bg-[#fffdfb] p-3 sm:p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase text-[#7a6f68]">
                    Oggi e prossimi 7 giorni
                  </h3>
                  <Clock3
                    size={17}
                    className="text-[#789888]"
                    aria-hidden="true"
                  />
                </div>
                {urgencyItems.length > 0 ? (
                  <div className="grid gap-2">
                    {urgencyItems.map((item) => (
                      <Link
                        className={`rounded-md border px-3 py-2 transition hover:bg-white ${item.tone}`}
                        href={item.href}
                        key={`${item.title}-${item.detail}-${item.date}`}
                      >
                        <span className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-[#29302d]">
                            {item.title}
                          </span>
                          <span className="text-xs font-semibold text-[#6c5f57]">
                            {formatDate(item.date)}
                          </span>
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-[#6c5f57]">
                          {item.detail}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#6c5f57]">
                    Nessuna urgenza nei prossimi 7 giorni.
                  </p>
                )}
              </div>

            </div>

            <div className="rounded-lg border border-[#eadfd7] bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center justify-between sm:mb-5">
                <h2 className="text-sm font-semibold uppercase text-[#7a6f68]">
                  Archivio salute
                </h2>
                <FileText
                  size={18}
                  className="text-[#789888]"
                  aria-hidden="true"
                />
              </div>
              <div className="grid gap-3">
                {healthArchiveLinks.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      className="group flex items-center justify-between rounded-lg border border-[#eee5dd] bg-[#fffdfb] px-3 py-2.5 transition hover:border-[#d5e0d8] hover:bg-[#f8fbf7] sm:px-4 sm:py-3"
                      href={item.href}
                      key={item.href}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={`flex size-10 items-center justify-center rounded-lg ${item.tone}`}
                        >
                          <Icon size={18} aria-hidden="true" />
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-[#313a35]">
                            {item.title}
                          </span>
                          <span className="hidden text-xs text-[#7a6f68] sm:block">
                            {item.detail}
                          </span>
                        </span>
                      </span>
                      <ArrowRight
                        size={17}
                        className="text-[#789888] transition group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-[#eadfd7] bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:mb-5 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-semibold uppercase text-[#947b6a] sm:text-sm sm:normal-case">
                  Agenda medica
                </p>
                <h2 className="mt-1 text-xl font-semibold text-[#29302d] sm:text-2xl">
                  Visite per persona
                </h2>
              </div>
              <Link
                className="flex h-10 items-center justify-center gap-2 rounded-md border border-[#d5e0d8] bg-[#f6fbf7] px-3 text-sm font-semibold text-[#315a45] transition hover:bg-[#edf6ef]"
                href="/calendar"
              >
                <CalendarDays size={17} aria-hidden="true" />
                Calendario
              </Link>
            </div>

            {visits.length > 0 ? (
              <div className="grid gap-3 sm:gap-4">
                {visitGroups.map((group) => (
                  <section
                    className="rounded-lg border border-[#eee5dd] bg-[#fffdfb] p-3 sm:p-4"
                    key={group.name}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3 sm:mb-3">
                      <div className="flex items-center gap-3">
                        <MemberAvatar
                          className="size-8 sm:size-9"
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
                      <span className="rounded-md bg-[#f6fbf7] px-2 py-1 text-xs font-semibold text-[#315a45]">
                        {group.visits.length === 1
                          ? "1 visita"
                          : `${group.visits.length} visite`}
                      </span>
                    </div>

                    {group.visits.length > 0 ? (
                      <div className="grid gap-3">
                        {group.visits.map((visit) => (
                        (() => {
                          const linkedDocuments =
                            documentsByVisitId.get(visit.id) ?? [];
                          const hasReceipt = linkedDocuments.some(
                            (document) => document.category === "pagamento"
                          );
                          const hasClinicalDocuments = linkedDocuments.some(
                            (document) => document.category !== "pagamento"
                          );
                          const needsDocuments =
                            visit.status === "booked" &&
                            isWithinDays(visit.visitDate, 7) &&
                            linkedDocuments.length === 0;

                          return (
                        <article
                          className="grid gap-3 rounded-lg border border-[#eee5dd] bg-white p-3 sm:gap-4 sm:p-4 md:grid-cols-[1fr_auto]"
                          key={visit.id}
                        >
                          <div className="flex gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#dbe7fb] text-[#375479] sm:size-11">
                              <Stethoscope size={19} aria-hidden="true" />
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-semibold text-[#29302d]">
                                  {visit.title}
                                </h4>
                                <span
                                  className={`rounded-md px-2 py-1 text-xs font-semibold ${statusTone(
                                    visit.status
                                  )}`}
                                >
                                  {statusLabel(visit.status)}
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-[#6c5f57]">
                                {visit.doctor ? `${visit.doctor} - ` : ""}
                                {visit.location ?? "Luogo non impostato"}
                              </p>
                              {visit.notes ? (
                                <p className="mt-2 rounded-md bg-[#fffaf6] px-3 py-2 text-sm leading-6 text-[#6c5f57]">
                                  <span className="font-semibold text-[#4f5c55]">
                                    Note:
                                  </span>{" "}
                                  {visit.notes}
                                </p>
                              ) : null}
                              <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
                                {hasReceipt ? (
                                  <span className="rounded-md bg-[#fff7f5] px-2 py-1 text-[#7f5146]">
                                    Ricevuta presente
                                  </span>
                                ) : null}
                                {hasClinicalDocuments ? (
                                  <span className="rounded-md bg-[#f7faff] px-2 py-1 text-[#375479]">
                                    Documenti collegati
                                  </span>
                                ) : null}
                                {needsDocuments ? (
                                  <span className="rounded-md bg-[#fff8e9] px-2 py-1 text-[#7a5b2f]">
                                    Documenti mancanti
                                  </span>
                                ) : null}
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#6c5f57]">
                                <span className="rounded-md bg-[#f6fbf7] px-2 py-1">
                                  Pagare: {formatDate(visit.paymentDueDate)}
                                </span>
                                <span className="rounded-md bg-[#faf7ff] px-2 py-1">
                                  Disdire:{" "}
                                  {formatDate(visit.cancellationDueDate)}
                                </span>
                                {visit.price ? (
                                  <span className="rounded-md bg-[#fff7f5] px-2 py-1">
                                    Ticket: {visit.price.toFixed(2)} €
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-3 md:items-end md:justify-between">
                            <div className="flex items-center gap-2 text-sm font-semibold text-[#315a45]">
                              <CheckCircle2 size={18} aria-hidden="true" />
                              {formatDate(visit.visitDate)}
                              {visit.visitTime ? ` · ${visit.visitTime}` : ""}
                            </div>
                            <div className="flex flex-wrap gap-2 md:justify-end">
                              {canEdit ? (
                                <VisitForm
                                  mode="edit"
                                  visit={visit}
                                  familyMembers={memberNames}
                                />
                              ) : null}
                              {canEdit && visit.status === "booked" ? (
                                <CancelVisitButton
                                  visitId={visit.id}
                                  label={visit.title}
                                />
                              ) : null}
                              {visit.status !== "booked" ? (
                                <span className="flex h-9 items-center justify-center rounded-md border border-[#eee5dd] bg-[#fffdfb] px-3 text-sm font-semibold text-[#7a6f68]">
                                  {visit.status === "cancelled"
                                    ? "Nessun promemoria"
                                    : "Storico"}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </article>
                          );
                        })()
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-md border border-dashed border-[#d9cfc6] bg-white px-3 py-2 text-xs text-[#6c5f57] sm:rounded-lg sm:px-4 sm:py-3 sm:text-sm">
                        Nessuna visita per questa persona.
                      </div>
                    )}
                  </section>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[#d9cfc6] bg-[#fffaf6] p-6 text-center">
                <CalendarDays
                  size={28}
                  className="mx-auto text-[#947b6a]"
                  aria-hidden="true"
                />
                <h3 className="mt-3 text-base font-semibold text-[#29302d]">
                  Nessuna visita salvata
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6c5f57]">
                  Quando aggiungerai la prima visita, apparirà qui con date di
                  pagamento e disdetta.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
