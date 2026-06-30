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
import { Medication } from "@/app/models/Medication";
import { ReminderFilters } from "@/app/components/ReminderFilters";
import type { ReminderViewItem } from "@/app/components/ReminderFilters";
import { MarkAllNotificationsReadButton } from "@/app/components/MarkAllNotificationsReadButton";
import {
  applyNotificationStates,
  buildNotifications,
} from "@/app/lib/notifications";

const PAGE_SIZE = 10;

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

type StoredMedication = {
  _id: { toString: () => string };
  memberName: string;
  name: string;
  dosage?: string;
  stockQuantity?: number;
  stockUnit?: string;
  lowStockThreshold?: number;
  intakeTime?: string;
  intakeTimes?: string[];
  frequency?: string;
  weekdays?: number[];
  schedule?: string;
  startDate?: Date;
  endDate?: Date;
  active: boolean;
};

async function getNotifications(
  userId: string,
  familyId: string,
  members: FamilyMember[]
): Promise<ReminderViewItem[]> {
  await connectMongo();

  const [visits, medications] = await Promise.all([
    Visit.find({ familyId }).sort({ visitDate: 1 }).lean<StoredVisit[]>(),
    Medication.find({ familyId, active: true })
      .sort({ memberName: 1, name: 1 })
      .lean<StoredMedication[]>(),
  ]);

  const notifications = buildNotifications(
    visits.map((visit) => ({
      id: visit._id.toString(),
      memberName: displayFamilyMemberName(visit.memberName, members),
      title: visit.title,
      visitDate: visit.visitDate.toISOString(),
      visitTime: visit.visitTime,
      paymentDueDate: visit.paymentDueDate?.toISOString(),
      cancellationDueDate: visit.cancellationDueDate?.toISOString(),
      status: visit.status ?? "booked",
    })),
    medications.map((medication) => ({
      id: medication._id.toString(),
      memberName: displayFamilyMemberName(medication.memberName, members),
      name: medication.name,
      dosage: medication.dosage,
      intakeTime: medication.intakeTime,
      intakeTimes: medication.intakeTimes,
      frequency: medication.frequency,
      weekdays: medication.weekdays,
      schedule: medication.schedule,
      startDate: medication.startDate?.toISOString(),
      endDate: medication.endDate?.toISOString(),
      active: medication.active,
    }))
  );

  return applyNotificationStates(userId, notifications);
}

type RemindersPageProps = {
  searchParams?: Promise<{
    page?: string;
  }>;
};

export default async function RemindersPage({ searchParams }: RemindersPageProps) {
  const user = await requireVerifiedUser();
  const params = await searchParams;
  const currentPage = Math.max(1, Number(params?.page ?? 1) || 1);
  const members = await getFamilyMembers(user);
  const reminders = await getNotifications(user.id, user.familyId, members);
  const unreadCount = reminders.filter((reminder) => !reminder.readAt).length;
  const unreadNotificationIds = reminders
    .filter((reminder) => !reminder.readAt)
    .map((reminder) => reminder.id);
  const totalPages = Math.max(1, Math.ceil(reminders.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const paginatedReminders = reminders.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );
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
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-semibold text-[#29302d]">
                  Notifiche
                </h1>
                {unreadCount > 0 ? (
                  <>
                    <span className="rounded-md bg-[#ef8580] px-2 py-1 text-xs font-bold text-white">
                      {unreadCount} non lette
                    </span>
                    <MarkAllNotificationsReadButton
                      notificationIds={unreadNotificationIds}
                    />
                  </>
                ) : null}
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6c5f57]">
                Campanella del nucleo: pagamenti e disdette in scadenza domani,
                più i farmaci da ricordare oggi.
              </p>
            </div>
          </div>
        </section>

        <ReminderFilters
          members={reminderMemberNames}
          reminders={paginatedReminders}
        />

        {reminders.length > PAGE_SIZE ? (
          <nav className="flex items-center justify-between gap-3 rounded-lg border border-[#eadfd7] bg-white p-3 text-sm font-semibold text-[#4f5c55] shadow-sm">
            <Link
              className={`rounded-md border border-[#e3d7cf] px-3 py-2 transition hover:bg-[#f8f1ec] ${
                page <= 1 ? "pointer-events-none opacity-40" : ""
              }`}
              href={`/reminders?page=${page - 1}`}
            >
              Precedenti 10
            </Link>
            <span>
              Pagina {page} di {totalPages}
            </span>
            <Link
              className={`rounded-md border border-[#e3d7cf] px-3 py-2 transition hover:bg-[#f8f1ec] ${
                page >= totalPages ? "pointer-events-none opacity-40" : ""
              }`}
              href={`/reminders?page=${page + 1}`}
            >
              Successive 10
            </Link>
          </nav>
        ) : null}
      </div>
    </main>
  );
}
