"use client";

import { useState } from "react";
import {
  Bell,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileText,
  Pill,
} from "lucide-react";
import { NotificationLink } from "@/app/components/NotificationLink";

export type ReminderViewItem = {
  id: string;
  date: string;
  detail: string;
  href: string;
  memberName: string;
  readAt?: string;
  title: string;
  tone: string;
  type:
    | "visit"
    | "payment"
    | "cancellation"
    | "recipe"
    | "document"
    | "medication";
};

type ReminderFiltersProps = {
  members: string[];
  reminders: ReminderViewItem[];
};

const typeLabels = {
  all: "Tutti",
  visit: "Visite",
  payment: "Pagamenti",
  cancellation: "Disdette",
  recipe: "Ricette",
  document: "Documenti",
  medication: "Farmaci",
};

const icons = {
  visit: CalendarDays,
  payment: CreditCard,
  cancellation: Bell,
  recipe: ClipboardList,
  document: FileText,
  medication: Pill,
};

function formatDate(value?: string) {
  if (!value) return "Non impostata";

  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function ReminderFilters({ members, reminders }: ReminderFiltersProps) {
  const [selectedMember, setSelectedMember] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const filtered = reminders.filter((reminder) => {
    const memberMatches =
      selectedMember === "all" || reminder.memberName === selectedMember;
    const typeMatches = selectedType === "all" || reminder.type === selectedType;

    return memberMatches && typeMatches;
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-lg border border-[#eadfd7] bg-white p-3 shadow-sm sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-[#4f5c55]">Persona</span>
          <select
            className="h-10 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm outline-none focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
            value={selectedMember}
            onChange={(event) => setSelectedMember(event.target.value)}
          >
            <option value="all">Tutti</option>
            {members.map((member) => (
              <option key={member} value={member}>
                {member}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-[#4f5c55]">Tipo</span>
          <select
            className="h-10 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm outline-none focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value)}
          >
            {Object.entries(typeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filtered.length > 0 ? (
        <section className="grid gap-3">
          {filtered.map((reminder) => {
            const Icon = icons[reminder.type];

            return (
              <NotificationLink
                className={`rounded-lg border p-4 shadow-sm transition hover:bg-white ${reminder.tone}`}
                href={reminder.href}
                key={`${reminder.title}-${reminder.detail}-${reminder.date}`}
                notificationId={reminder.id}
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
                      <span
                        className={`mt-1 inline-flex rounded-md px-2 py-1 text-xs font-semibold ${
                          reminder.readAt
                            ? "bg-white/70 text-[#7a6f68]"
                            : "bg-[#ef8580] text-white"
                        }`}
                      >
                        {reminder.readAt ? "Letta" : "Nuova"}
                      </span>
                      <p className="mt-1 text-sm leading-6 text-[#6c5f57]">
                        {reminder.detail}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-[#4f5c55]">
                    {formatDate(reminder.date)}
                  </span>
                </div>
              </NotificationLink>
            );
          })}
        </section>
      ) : (
        <section className="rounded-lg border border-dashed border-[#d9cfc6] bg-white p-6 text-center shadow-sm">
          <Bell size={28} className="mx-auto text-[#947b6a]" aria-hidden="true" />
          <h2 className="mt-3 text-base font-semibold text-[#29302d]">
            Nessun promemoria trovato
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6c5f57]">
            Prova a cambiare persona o tipo.
          </p>
        </section>
      )}
    </div>
  );
}
