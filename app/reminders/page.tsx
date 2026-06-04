import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileText,
} from "lucide-react";
import { connectMongo } from "@/app/lib/mongodb";
import { requireVerifiedUser } from "@/app/lib/auth";
import { Visit } from "@/app/models/Visit";
import { Recipe } from "@/app/models/Recipe";
import { HealthDocument } from "@/app/models/HealthDocument";

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

type StoredDocument = {
  visitId?: string;
};

type ReminderItem = {
  date: string;
  detail: string;
  href: string;
  icon: typeof Bell;
  title: string;
  tone: string;
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

async function getReminders(familyId: string): Promise<ReminderItem[]> {
  await connectMongo();

  const [visits, recipes, documents] = await Promise.all([
    Visit.find({ familyId }).sort({ visitDate: 1 }).lean<StoredVisit[]>(),
    Recipe.find({ familyId }).sort({ renewalDate: 1 }).lean<StoredRecipe[]>(),
    HealthDocument.find({ familyId }).select("visitId").lean<StoredDocument[]>(),
  ]);
  const linkedVisitIds = new Set(
    documents.map((document) => document.visitId).filter(Boolean)
  );

  const visitReminders = visits.flatMap((visit) => {
    const status = visit.status ?? "booked";
    if (status !== "booked") return [];

    const visitDate = visit.visitDate.toISOString();
    const items: ReminderItem[] = [];

    if (withinNextDays(visitDate, 3)) {
      items.push({
        date: visitDate,
        detail: `${visit.memberName} · ${visit.title}${
          visit.visitTime ? ` · ${visit.visitTime}` : ""
        }`,
        href: "/calendar",
        icon: CalendarDays,
        title: "Visita imminente",
        tone: "border-[#d5e0d8] bg-[#f6fbf7] text-[#315a45]",
      });
    }

    if (visit.paymentDueDate) {
      const paymentDate = visit.paymentDueDate.toISOString();
      items.push({
        date: paymentDate,
        detail: `${visit.memberName} · ${visit.title} · entro ${formatDate(
          paymentDate
        )}`,
        href: "/payments",
        icon: CreditCard,
        title: "Pagamento visita",
        tone: "border-[#f1d8cf] bg-[#fff7f5] text-[#7f5146]",
      });
    }

    if (visit.cancellationDueDate) {
      const cancellationDate = visit.cancellationDueDate.toISOString();
      items.push({
        date: cancellationDate,
        detail: `${visit.memberName} · ${visit.title} · entro ${formatDate(
          cancellationDate
        )}`,
        href: "/calendar",
        icon: Bell,
        title: "Termine disdetta",
        tone: "border-[#f0d3a6] bg-[#fff8e9] text-[#7a5b2f]",
      });
    }

    if (withinNextDays(visitDate, 7) && !linkedVisitIds.has(visit._id.toString())) {
      items.push({
        date: visitDate,
        detail: `${visit.memberName} · ${visit.title} · controlla ricetta o referti`,
        href: "/documents",
        icon: FileText,
        title: "Documenti da collegare",
        tone: "border-[#dbe7fb] bg-[#f7faff] text-[#375479]",
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
        detail: `${recipe.memberName} · ${recipe.medicationName} · entro ${formatDate(
          renewalDate
        )}`,
        href: "/recipes",
        icon: ClipboardList,
        title: "Rinnovo ricetta",
        tone: "border-[#d7d0ec] bg-[#faf7ff] text-[#5d527b]",
      };
    });

  const today = startOfDay(new Date());

  return [...visitReminders, ...recipeReminders]
    .filter((reminder) => new Date(reminder.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export default async function RemindersPage() {
  const user = await requireVerifiedUser();
  const reminders = await getReminders(user.familyId);

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

        {reminders.length > 0 ? (
          <section className="grid gap-3">
            {reminders.map((reminder) => {
              const Icon = reminder.icon;

              return (
                <Link
                  className={`rounded-lg border p-4 shadow-sm transition hover:bg-white ${reminder.tone}`}
                  href={reminder.href}
                  key={`${reminder.title}-${reminder.detail}-${reminder.date}`}
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/75">
                        <Icon size={18} aria-hidden="true" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-[#29302d]">
                          {reminder.title}
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-[#6c5f57]">
                          {reminder.detail}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-[#4f5c55]">
                      {formatDate(reminder.date)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </section>
        ) : (
          <section className="rounded-lg border border-dashed border-[#d9cfc6] bg-white p-6 text-center shadow-sm">
            <Bell size={28} className="mx-auto text-[#947b6a]" aria-hidden="true" />
            <h2 className="mt-3 text-base font-semibold text-[#29302d]">
              Nessun promemoria attivo
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6c5f57]">
              Quando ci saranno visite, ricette o scadenze da seguire,
              compariranno qui.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
