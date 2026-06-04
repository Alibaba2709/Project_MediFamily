export const weekdayOptions = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mer" },
  { value: 4, label: "Gio" },
  { value: 5, label: "Ven" },
  { value: 6, label: "Sab" },
  { value: 0, label: "Dom" },
];

export const frequencyLabels: Record<string, string> = {
  daily: "Tutti i giorni",
  specific_days: "Giorni specifici",
  as_needed: "Al bisogno",
};

type MedicationSchedule = {
  active?: boolean;
  intakeTime?: string;
  intakeTimes?: string[];
  frequency?: string;
  weekdays?: number[];
  startDate?: Date | string;
  endDate?: Date | string;
};

export function todayDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Rome",
    year: "numeric",
  }).format(date);
}

export function normalizeIntakeTimes(value: unknown, fallback?: unknown) {
  const rawTimes = Array.isArray(value) ? value : fallback ? [fallback] : [];

  return Array.from(
    new Set(
      rawTimes
        .map((time) => String(time ?? "").trim())
        .filter((time) => /^\d{2}:\d{2}$/.test(time))
    )
  ).sort((a, b) => a.localeCompare(b));
}

export function normalizeWeekdays(value: unknown) {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .map((day) => Number(day))
        .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
    )
  );
}

export function getMedicationTimes(medication: MedicationSchedule) {
  return normalizeIntakeTimes(
    medication.intakeTimes,
    medication.intakeTime
  );
}

function valueToDateKey(value?: Date | string) {
  if (!value) return "";
  return todayDateKey(value instanceof Date ? value : new Date(value));
}

export function isMedicationDueOnDate(
  medication: MedicationSchedule,
  date = new Date()
) {
  if (medication.active === false) return false;

  const dateKey = todayDateKey(date);
  const startDateKey = valueToDateKey(medication.startDate);
  const endDateKey = valueToDateKey(medication.endDate);

  if (startDateKey && startDateKey > dateKey) return false;
  if (endDateKey && endDateKey < dateKey) return false;

  if (medication.frequency === "as_needed") return false;

  if (medication.frequency === "specific_days") {
    return (medication.weekdays ?? []).includes(date.getDay());
  }

  return true;
}

export function medicationTimeSortValue(value?: string) {
  return value || "99:99";
}
