import { connectMongo } from "@/app/lib/mongodb";
import {
  getMedicationTimes,
  isMedicationDueOnDate,
  todayDateKey,
} from "@/app/lib/medications";
import { NotificationState } from "@/app/models/NotificationState";

export type AppNotificationType = "payment" | "cancellation" | "medication";

export type AppNotification = {
  id: string;
  type: AppNotificationType;
  title: string;
  detail: string;
  memberName: string;
  href: string;
  date: string;
  tone: string;
  readAt?: string;
  dismissedAt?: string;
};

export type NotificationVisit = {
  id: string;
  memberName: string;
  title: string;
  visitDate?: string;
  visitTime?: string;
  paymentDueDate?: string;
  cancellationDueDate?: string;
  status: "booked" | "paid" | "cancelled" | "completed";
};

export type NotificationMedication = {
  id: string;
  memberName: string;
  name: string;
  dosage?: string;
  intakeTime?: string;
  intakeTimes?: string[];
  frequency?: string;
  weekdays?: number[];
  schedule?: string;
  startDate?: string;
  endDate?: string;
  active: boolean;
};

type StoredNotificationState = {
  notificationId: string;
  readAt?: Date;
  dismissedAt?: Date;
};

function tomorrowDateKey(now = new Date()) {
  return todayDateKey(new Date(now.getTime() + 24 * 60 * 60 * 1000));
}

function sameRomeDay(value: string | undefined, dateKey: string) {
  if (!value) return false;

  return todayDateKey(new Date(value)) === dateKey;
}

function todayAtTime(value?: string) {
  const date = new Date();
  const [hours, minutes] = (value ?? "").split(":").map(Number);

  if (Number.isFinite(hours) && Number.isFinite(minutes)) {
    date.setHours(hours, minutes, 0, 0);
  }

  return date.toISOString();
}

function stateKey(value: string) {
  return value.replaceAll(/[^a-zA-Z0-9:._-]/g, "-");
}

export function buildNotifications(
  visits: NotificationVisit[],
  medications: NotificationMedication[],
  now = new Date()
): AppNotification[] {
  const tomorrow = tomorrowDateKey(now);
  const today = todayDateKey(now);

  const paymentNotifications = visits
    .filter((visit) => visit.status === "booked")
    .filter((visit) => sameRomeDay(visit.paymentDueDate, tomorrow))
    .map((visit) => ({
      id: stateKey(`payment:${visit.id}:${tomorrow}`),
      type: "payment" as const,
      title: "Pagamento in scadenza domani",
      detail: `${visit.memberName} · ${visit.title}`,
      memberName: visit.memberName,
      href: "/payments",
      date: visit.paymentDueDate as string,
      tone: "border-[#f1d8cf] bg-[#fff7f5] text-[#7f5146]",
    }));

  const cancellationNotifications = visits
    .filter((visit) => visit.status === "booked")
    .filter((visit) => sameRomeDay(visit.cancellationDueDate, tomorrow))
    .map((visit) => ({
      id: stateKey(`cancellation:${visit.id}:${tomorrow}`),
      type: "cancellation" as const,
      title: "Disdetta entro domani",
      detail: `${visit.memberName} · ${visit.title}`,
      memberName: visit.memberName,
      href: "/calendar",
      date: visit.cancellationDueDate as string,
      tone: "border-[#f0d3a6] bg-[#fff8e9] text-[#7a5b2f]",
    }));

  const medicationNotifications = medications
    .filter((medication) => medication.active)
    .filter((medication) => isMedicationDueOnDate(medication, now))
    .flatMap((medication) =>
      getMedicationTimes(medication).map((time) => ({
        id: stateKey(`medication:${medication.id}:${today}:${time}`),
        type: "medication" as const,
        title: "Promemoria farmaco",
        detail: `${medication.memberName} · ${medication.name}${
          medication.dosage ? ` · ${medication.dosage}` : ""
        } · ${time}${medication.schedule ? ` · ${medication.schedule}` : ""}`,
        memberName: medication.memberName,
        href: `/medications#medication-${medication.id}`,
        date: todayAtTime(time),
        tone: "border-[#d5e0d8] bg-[#f6fbf7] text-[#315a45]",
      }))
    );

  return [
    ...paymentNotifications,
    ...cancellationNotifications,
    ...medicationNotifications,
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function applyNotificationStates(
  userId: string,
  notifications: AppNotification[]
) {
  if (notifications.length === 0) return notifications;

  await connectMongo();

  const states = await NotificationState.find({
    userId,
    notificationId: { $in: notifications.map((notification) => notification.id) },
  }).lean<StoredNotificationState[]>();
  const stateById = new Map(
    states.map((state) => [state.notificationId, state])
  );

  return notifications
    .map((notification) => {
      const state = stateById.get(notification.id);

      return {
        ...notification,
        readAt: state?.readAt?.toISOString(),
        dismissedAt: state?.dismissedAt?.toISOString(),
      };
    })
    .filter((notification) => !notification.dismissedAt);
}

export function unreadNotificationCount(notifications: AppNotification[]) {
  return notifications.filter((notification) => !notification.readAt).length;
}
