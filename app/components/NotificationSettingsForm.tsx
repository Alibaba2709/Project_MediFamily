"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Loader2, Save } from "lucide-react";
import type { FamilyNotificationSettings } from "@/app/lib/family";

type NotificationSettingsFormProps = {
  settings: FamilyNotificationSettings;
};

export function NotificationSettingsForm({
  settings,
}: NotificationSettingsFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/family/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        emailEnabled: formData.has("emailEnabled"),
        paymentEnabled: formData.has("paymentEnabled"),
        cancellationEnabled: formData.has("cancellationEnabled"),
        recipeEnabled: formData.has("recipeEnabled"),
        documentEnabled: formData.has("documentEnabled"),
        visitDaysBefore: formData.get("visitDaysBefore"),
        recipeDaysBefore: formData.get("recipeDaysBefore"),
      }),
    });
    const result = await response.json();

    setIsSaving(false);

    if (!response.ok) {
      setError(result.error ?? "Non sono riuscita a salvare le notifiche.");
      return;
    }

    setMessage("Impostazioni notifiche salvate.");
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-[#f7e2bf] text-[#7a5b2f]">
          <Bell size={20} aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase text-[#7a6f68]">
            Notifiche
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#6c5f57]">
            Decidi quali promemoria ricevere via email.
          </p>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-semibold text-[#4f5c55]">
        <input
          className="size-4 accent-[#315a45]"
          defaultChecked={settings.emailEnabled}
          name="emailEnabled"
          type="checkbox"
        />
        Email promemoria attive
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-[#4f5c55]">
            Giorni prima visita
          </span>
          <input
            className="h-10 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm outline-none focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
            defaultValue={settings.visitDaysBefore}
            min="0"
            name="visitDaysBefore"
            type="number"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-[#4f5c55]">
            Giorni prima ricetta
          </span>
          <input
            className="h-10 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm outline-none focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
            defaultValue={settings.recipeDaysBefore}
            min="0"
            name="recipeDaysBefore"
            type="number"
          />
        </label>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {[
          ["paymentEnabled", "Pagamenti", settings.paymentEnabled],
          ["cancellationEnabled", "Disdette", settings.cancellationEnabled],
          ["recipeEnabled", "Ricette", settings.recipeEnabled],
          ["documentEnabled", "Documenti mancanti", settings.documentEnabled],
        ].map(([name, label, checked]) => (
          <label
            className="flex items-center gap-2 rounded-md bg-[#fffaf6] px-3 py-2 text-sm font-semibold text-[#4f5c55]"
            key={String(name)}
          >
            <input
              className="size-4 accent-[#315a45]"
              defaultChecked={Boolean(checked)}
              name={String(name)}
              type="checkbox"
            />
            {label}
          </label>
        ))}
      </div>

      {error ? (
        <p className="rounded-md bg-[#fff7f5] px-3 py-2 text-sm font-medium text-[#9f4d46]">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-md bg-[#f6fbf7] px-3 py-2 text-sm font-medium text-[#315a45]">
          {message}
        </p>
      ) : null}

      <button
        className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#315a45] px-4 text-sm font-semibold text-white transition hover:bg-[#274737] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSaving}
        type="submit"
      >
        {isSaving ? (
          <Loader2 className="animate-spin" size={16} />
        ) : (
          <Save size={16} aria-hidden="true" />
        )}
        Salva notifiche
      </button>
    </form>
  );
}
