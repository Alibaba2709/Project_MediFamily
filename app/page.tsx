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
import { connectMongo } from "@/app/lib/mongodb";
import { requireVerifiedUser } from "@/app/lib/auth";
import { Visit } from "@/app/models/Visit";
import { Recipe } from "@/app/models/Recipe";
import { VisitForm } from "@/app/components/VisitForm";
import { LogoutButton } from "@/app/components/LogoutButton";
import { AddFamilyMemberForm } from "@/app/components/AddFamilyMemberForm";
import { CancelVisitButton } from "@/app/components/CancelVisitButton";
import {
  getFamilyBookingSettings,
  getFamilyMembers,
  memberSlug,
} from "@/app/lib/family";

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
  renewalDate?: string;
};

type StoredRecipe = {
  _id: { toString: () => string };
  memberName: string;
  medicationName: string;
  renewalDate?: Date;
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
      renewalDate: recipe.renewalDate?.toISOString(),
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

function groupVisitsByMember(
  visits: DashboardVisit[],
  members: Awaited<ReturnType<typeof getFamilyMembers>>
) {
  return members.map((member) => ({
    ...member,
    visits: visits.filter((visit) => visit.memberName === member.name),
  }));
}

function buildSmartReminders(visits: DashboardVisit[], recipes: DashboardRecipe[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const visitActions = visits.flatMap((visit) => {
    const actions = [];

    if (visit.paymentDueDate && visit.status === "booked") {
      actions.push({
        date: visit.paymentDueDate,
        title: "Pagamento visita",
        detail: `${visit.memberName} · ${visit.title} · entro ${formatDate(
          visit.paymentDueDate
        )}`,
      });
    }

    if (visit.cancellationDueDate && visit.status === "booked") {
      actions.push({
        date: visit.cancellationDueDate,
        title: "Termine disdetta",
        detail: `${visit.memberName} · ${visit.title} · entro ${formatDate(
          visit.cancellationDueDate
        )}`,
      });
    }

    return actions;
  });

  const recipeActions = recipes
    .filter((recipe) => recipe.renewalDate)
    .map((recipe) => ({
      date: recipe.renewalDate as string,
      title: "Rinnovo ricetta",
      detail: `${recipe.memberName} · ${recipe.medicationName} · entro ${formatDate(
        recipe.renewalDate
      )}`,
    }));

  return [...visitActions, ...recipeActions]
    .filter((action) => new Date(action.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);
}

export default async function Home() {
  const user = await requireVerifiedUser();
  const members = await getFamilyMembers(user);
  const bookingSettings = await getFamilyBookingSettings(user);
  const memberNames = members.map((member) => member.name);
  const visits = await getVisits(user.familyId);
  const recipes = await getRecipes(user.familyId);
  const visitGroups = groupVisitsByMember(visits, members);
  const smartReminders = buildSmartReminders(visits, recipes);
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
            <a
              className="hidden h-10 items-center gap-2 rounded-md border border-[#e3d7cf] bg-white px-3 text-sm font-medium text-[#4f5c55] shadow-sm transition hover:bg-[#f8f1ec] sm:flex"
              href="#promemoria"
            >
              <Bell size={17} aria-hidden="true" />
              Promemoria
            </a>
            <VisitForm familyMembers={memberNames} />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 sm:gap-6 sm:px-8 sm:py-6 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-3 sm:space-y-4">
          <details className="group rounded-lg border border-[#eadfd7] bg-white p-3 shadow-sm sm:p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#f9d8d6] text-sm font-semibold text-[#313a35] sm:size-10">
                  {user.name.slice(0, 1)}
                </span>
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
                {members.map((member) => (
                  <Link
                    className="flex items-center gap-3 rounded-md p-1 transition hover:bg-[#fffaf6]"
                    href={`/members/${memberSlug(member.name)}`}
                    key={member.name}
                  >
                    <div
                      className={`flex size-9 items-center justify-center rounded-lg ${member.tone} text-sm font-semibold text-[#313a35]`}
                    >
                      {member.name.slice(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#313a35]">
                        {member.name}
                      </p>
                      <p className="truncate text-xs text-[#7a6f68]">
                        {member.role}
                      </p>
                    </div>
                  </Link>
                ))}
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

              <div
                className="mt-4 rounded-lg border border-[#eee5dd] bg-[#fffdfb] p-3 sm:p-4"
                id="promemoria"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase text-[#7a6f68]">
                    Promemoria
                  </h3>
                  <Bell size={17} className="text-[#789888]" aria-hidden="true" />
                </div>
                {smartReminders.length > 0 ? (
                  <div className="grid gap-2">
                    {smartReminders.map((reminder) => (
                      <div
                        className="rounded-md bg-[#fffaf6] px-3 py-2"
                        key={`${reminder.title}-${reminder.detail}`}
                      >
                        <p className="text-sm font-semibold text-[#29302d]">
                          {reminder.title}
                        </p>
                        <p className="mt-1 text-xs text-[#6c5f57]">
                          {reminder.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#6c5f57]">
                    Nessun promemoria urgente impostato.
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
                        <div
                          className={`flex size-8 items-center justify-center rounded-lg ${group.tone} text-sm font-semibold text-[#313a35] sm:size-9`}
                        >
                          {group.name.slice(0, 1)}
                        </div>
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
                              <VisitForm
                                mode="edit"
                                visit={visit}
                                familyMembers={memberNames}
                              />
                              {visit.status === "booked" ? (
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
