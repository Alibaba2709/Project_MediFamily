"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2, Save } from "lucide-react";
import type { FamilyBookingSettings } from "@/app/lib/family";

type BookingSettingsFormProps = {
  settings: FamilyBookingSettings;
};

const regions = [
  "",
  "Abruzzo",
  "Basilicata",
  "Calabria",
  "Campania",
  "Emilia-Romagna",
  "Friuli-Venezia Giulia",
  "Lazio",
  "Liguria",
  "Lombardia",
  "Marche",
  "Molise",
  "Piemonte",
  "Puglia",
  "Sardegna",
  "Sicilia",
  "Toscana",
  "Trentino-Alto Adige",
  "Umbria",
  "Valle d'Aosta",
  "Veneto",
];

export function BookingSettingsForm({ settings }: BookingSettingsFormProps) {
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
    const response = await fetch("/api/family/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    const result = await response.json();

    setIsSaving(false);

    if (!response.ok) {
      setError(result.error ?? "Non sono riuscita a salvare il portale.");
      return;
    }

    setMessage("Impostazioni prenotazioni salvate.");
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <h2 className="text-sm font-semibold uppercase text-[#7a6f68]">
          Gestione prenotazioni
        </h2>
        <p className="mt-1 text-sm leading-6 text-[#6c5f57]">
          Scegli il portale sanitario da aprire dal menu famiglia.
        </p>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-[#4f5c55]">Regione</span>
        <select
          className="h-10 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm outline-none transition focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
          defaultValue={settings.region}
          name="bookingRegion"
        >
          <option value="">Da configurare</option>
          {regions
            .filter((region) => region)
            .map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
        </select>
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-[#4f5c55]">
          Nome portale
        </span>
        <input
          className="h-10 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm outline-none transition placeholder:text-[#a1968e] focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
          defaultValue={settings.portalName}
          name="bookingPortalName"
          placeholder="Es. Puglia Salute, CUP Lazio, Fascicolo Sanitario"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-[#4f5c55]">
          Link prenotazioni
        </span>
        <input
          className="h-10 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm outline-none transition placeholder:text-[#a1968e] focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
          defaultValue={settings.portalUrl}
          name="bookingPortalUrl"
          placeholder="https://..."
          type="url"
        />
      </label>

      {settings.portalUrl ? (
        <a
          className="inline-flex h-10 items-center gap-2 rounded-md border border-[#d5e0d8] bg-[#f6fbf7] px-3 text-sm font-semibold text-[#315a45] transition hover:bg-[#edf6ef]"
          href={settings.portalUrl}
          rel="noreferrer"
          target="_blank"
        >
          <ExternalLink size={16} aria-hidden="true" />
          Apri portale attuale
        </a>
      ) : null}

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
        Salva portale
      </button>
    </form>
  );
}
