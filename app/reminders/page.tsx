import Link from "next/link";
import { ArrowLeft, Bell } from "lucide-react";
import { connectMongo } from "@/app/lib/mongodb";
import { requireVerifiedUser } from "@/app/lib/auth";
import {
  displayFamilyMemberName,
  getFamilyMembers,
  normalizeFamilyMemberNames,
  type FamilyMember,
} from "@/app/lib/family";
import { Visit } from "@/app/models/Visit";
import { Recipe } from "@/app/models/Recipe";
import { Medication } from "@/app/models/Medication";
import { HealthDocument } from "@/app/models/HealthDocument";
import { ReminderFilters } from "@/app/components/ReminderFilters";
import type { ReminderViewItem } from "@/app/components/ReminderFilters";

type StoredVisit = {
  _id: { toString: () => string };
  memberName: string;
  title: string;
  visitDate: Date;
  visitTime?: string;
  paymentDueDate?: Date;
  cancellationDueDate?: Date;
  status?: "booked" | "paid" | "cancelled" | "completed";
};

type StoredRecipe = {
  _id: { toString: () => string };
  memberName: string;
  medicationName: string;
  renewalDate?: Date;
};

type StoredMedication = {
  _id: { toString: () => string };
  memberName: string;
  name: string;
  dosage?: string;
  schedule?: string;
  active: boolean;
};

type StoredDocument = {
  visitId?: string;
};

function formatDate(value?: string) {
  if (!value) return "Non impostata";

  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function withinNextDays(value: string, days: number) {
  const today = startOfDay(new Date());
  const limit = new Date(today);
  limit.setDate(limit.getDate() + days);
  const date = startOfDay(new Date(value));

  return date >= today && date <= limit;
}

async function getReminders(
  familyId: string,
  members: FamilyMember[]
): Promise<ReminderViewItem[]> {
  await connectMongo();

  const [visits, recipes, medications, documents] = await Promise.all([
    Visit.find({ familyId }).sort({ visitDate: 1 }).lean<StoredVisit[]>(),
    Recipe.find({ familyId }).sort({ renewalDate: 1 }).lean<StoredRecipe[]>(),
    Medication.find({ familyId, active: true })
      .sort({ memberName: 1, name: 1 })
      .lean<StoredMedication[]>(),
    HealthDocument.find({ familyId }).select("visitId").lean<StoredDocument[]>(),
  ]);
  const linkedVisitIds = new Set(
    documents.map((document) => document.visitId).filter(Boolean)
  );

  const visitReminders = visits.flatMap((visit) => {
    const status = visit.status ?? "booked";
    if (status !== "booked") return [];

    const visitDate = visit.visitDate.toISOString();
    const items: ReminderViewItem[] = [];

    if (withinNextDays(visitDate, 3)) {
      const memberName = displayFamilyMemberName(visit.memberName, members);

      items.push({
        date: visitDate,
        detail: `${memberName} · ${visit.title}${
          visit.visitTime ? ` · ${visit.visitTime}` : ""
        }`,
        href: "/calendar",
        memberName,
        title: "Visita imminente",
        tone: "border-[#d5e0d8] bg-[#f6fbf7] text-[#315a45]",
        type: "visit",
      });
    }

    if (visit.paymentDueDate) {
      const paymentDate = visit.paymentDueDate.toISOString();
      const memberName = displayFamilyMemberName(visit.memberName, members);

      items.push({
        date: paymentDate,
        detail: `${memberName} · ${visit.title} · entro ${formatDate(
          paymentDate
        )}`,
        href: "/payments",
        memberName,
        title: "Pagamento visita",
        tone: "border-[#f1d8cf] bg-[#fff7f5] text-[#7f5146]",
        type: "payment",
      });
    }

    if (visit.cancellationDueDate) {
      const cancellationDate = visit.cancellationDueDate.toISOString();
      const memberName = displayFamilyMemberName(visit.memberName, members);

      items.push({
        date: cancellationDate,
        detail: `${memberName} · ${visit.title} · entro ${formatDate(
          cancellationDate
        )}`,
        href: "/calendar",
        memberName,
        title: "Termine disdetta",
        tone: "border-[#f0d3a6] bg-[#fff8e9] text-[#7a5b2f]",
        type: "cancellation",
      });
    }

    if (withinNextDays(visitDate, 7) && !linkedVisitIds.has(visit._id.toString())) {
      const memberName = displayFamilyMemberName(visit.memberName, members);

      items.push({
        date: visitDate,
        detail: `${memberName} · ${visit.title} · controlla ricetta o referti`,
        href: "/documents",
        memberName,
        title: "Documenti da collegare",
        tone: "border-[#dbe7fb] bg-[#f7faff] text-[#375479]",
        type: "document",
      });
    }

    return items;
  });

  const recipeReminders = recipes
    .filter((recipe) => recipe.renewalDate)
    .map((recipe) => {
      const renewalDate = recipe.renewalDate?.toISOString() as string;

      return {
        date: renewalDate,
        detail: `${displayFamilyMemberName(
          recipe.memberName,
          members
        )} · ${recipe.medicationName} · entro ${formatDate(
          renewalDate
        )}`,
        href: "/recipes",
        memberName: displayFamilyMemberName(recipe.memberName, members),
        title: "Rinnovo ricetta",
        tone: "border-[#d7d0ec] bg-[#faf7ff] text-[#5d527b]",
        type: "recipe" as const,
      };
    });

  const medicationReminders = medications.map((medication) => ({
    date: new Date().toISOString(),
    detail: `${displayFamilyMemberName(medication.memberName, members)} · ${medication.name}${
      medication.dosage ? ` · ${medication.dosage}` : ""
    }${medication.schedule ? ` · ${medication.schedule}` : ""}`,
    href: `/medications#medication-${medication._id.toString()}`,
    memberName: displayFamilyMemberName(medication.memberName, members),
    title: "Farmaco attivo",
    tone: "border-[#d5e0d8] bg-[#f6fbf7] text-[#315a45]",
    type: "medication" as const,
  }));

  const today = startOfDay(new Date());

  return [...visitReminders, ...recipeReminders, ...medicationReminders]
    .filter((reminder) => new Date(reminder.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export default async function RemindersPage() {
  const user = await requireVerifiedUser();
  const members = await getFamilyMembers(user);
  const reminders = await getReminders(user.familyId, members);
  const reminderMemberNames = normalizeFamilyMemberNames(
    [
      ...members.map((member) => member.name),
      ...reminders.map((reminder) => reminder.memberName),
    ],
    members
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
          <div className="flex items-start gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-[#f7e2bf] text-[#7a5b2f]">
              <Bell size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#947b6a]">
                Agenda intelligente
              </p>
              <h1 className="mt-1 text-3xl font-semibold text-[#29302d]">
                Promemoria
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6c5f57]">
                Tutte le cose da non perdere: visite imminenti, pagamenti,
                disdette, ricette e documenti da collegare.
              </p>
            </div>
          </div>
        </section>

        <ReminderFilters
          members={reminderMemberNames}
          reminders={reminders}
        />
      </div>
    </main>
  );
}
