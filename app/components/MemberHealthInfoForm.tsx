"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import type { FamilyMember } from "@/app/lib/family";

type MemberHealthInfoFormProps = {
  member: FamilyMember;
};

const bloodTypes = ["", "0+", "0-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

function initialForm(member: FamilyMember) {
  return {
    allergies: member.allergies ?? "",
    birthDate: member.birthDate ?? "",
    bloodType: member.bloodType ?? "",
    conditions: member.conditions ?? "",
    emergencyContactName: member.emergencyContactName ?? "",
    emergencyContactPhone: member.emergencyContactPhone ?? "",
    fiscalCode: member.fiscalCode ?? "",
    healthNotes: member.healthNotes ?? "",
    primaryDoctor: member.primaryDoctor ?? "",
  };
}

export function MemberHealthInfoForm({ member }: MemberHealthInfoFormProps) {
  const router = useRouter();
  const [form, setForm] = useState(() => initialForm(member));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSaving(true);

    const response = await fetch(
      `/api/family/members/${encodeURIComponent(member.name)}`,
      {
        body: JSON.stringify(form),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      }
    );
    const result = await response.json();

    setIsSaving(false);

    if (!response.ok) {
      setError(result.error ?? "Non sono riuscita a salvare la scheda.");
      return;
    }

    setMessage("Scheda sanitaria salvata.");
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase text-[#7a6f68]">
            Data di nascita
          </span>
          <input
            className="h-10 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm outline-none focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
            type="date"
            value={form.birthDate}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                birthDate: event.target.value,
              }))
            }
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase text-[#7a6f68]">
            Gruppo sanguigno
          </span>
          <select
            className="h-10 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm outline-none focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
            value={form.bloodType}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                bloodType: event.target.value,
              }))
            }
          >
            {bloodTypes.map((type) => (
              <option key={type} value={type}>
                {type || "Non impostato"}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-2">
        <span className="text-xs font-semibold uppercase text-[#7a6f68]">
          Codice fiscale
        </span>
        <input
          className="h-10 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm uppercase outline-none placeholder:text-[#a1968e] focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
          placeholder="Es. RSSR..."
          value={form.fiscalCode}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              fiscalCode: event.target.value,
            }))
          }
        />
      </label>

      <label className="block space-y-2">
        <span className="text-xs font-semibold uppercase text-[#7a6f68]">
          Medico di base
        </span>
        <input
          className="h-10 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm outline-none placeholder:text-[#a1968e] focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
          placeholder="Nome medico o ambulatorio"
          value={form.primaryDoctor}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              primaryDoctor: event.target.value,
            }))
          }
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase text-[#7a6f68]">
            Contatto emergenza
          </span>
          <input
            className="h-10 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm outline-none placeholder:text-[#a1968e] focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
            placeholder="Nome e cognome"
            value={form.emergencyContactName}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                emergencyContactName: event.target.value,
              }))
            }
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase text-[#7a6f68]">
            Telefono emergenza
          </span>
          <input
            className="h-10 w-full rounded-md border border-[#ded4cb] bg-white px-3 text-sm outline-none placeholder:text-[#a1968e] focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
            placeholder="+39 ..."
            value={form.emergencyContactPhone}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                emergencyContactPhone: event.target.value,
              }))
            }
          />
        </label>
      </div>

      <label className="block space-y-2">
        <span className="text-xs font-semibold uppercase text-[#7a6f68]">
          Allergie
        </span>
        <textarea
          className="min-h-20 w-full resize-y rounded-md border border-[#ded4cb] bg-white px-3 py-2 text-sm outline-none placeholder:text-[#a1968e] focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
          placeholder="Farmaci, alimenti, materiali..."
          value={form.allergies}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              allergies: event.target.value,
            }))
          }
        />
      </label>

      <label className="block space-y-2">
        <span className="text-xs font-semibold uppercase text-[#7a6f68]">
          Patologie
        </span>
        <textarea
          className="min-h-20 w-full resize-y rounded-md border border-[#ded4cb] bg-white px-3 py-2 text-sm outline-none placeholder:text-[#a1968e] focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
          placeholder="Es. diabete, ipertensione, asma..."
          value={form.conditions}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              conditions: event.target.value,
            }))
          }
        />
      </label>

      <label className="block space-y-2">
        <span className="text-xs font-semibold uppercase text-[#7a6f68]">
          Note sanitarie
        </span>
        <textarea
          className="min-h-20 w-full resize-y rounded-md border border-[#ded4cb] bg-white px-3 py-2 text-sm outline-none placeholder:text-[#a1968e] focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
          placeholder="Informazioni utili da ricordare"
          value={form.healthNotes}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              healthNotes: event.target.value,
            }))
          }
        />
      </label>

      {error ? (
        <p className="rounded-md border border-[#edc9c3] bg-[#fff7f5] px-3 py-2 text-sm font-medium text-[#7f5146]">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-md border border-[#d5e0d8] bg-[#f6fbf7] px-3 py-2 text-sm font-medium text-[#315a45]">
          {message}
        </p>
      ) : null}

      <button
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#315a45] px-3 text-sm font-semibold text-white transition hover:bg-[#274737] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isSaving}
        type="submit"
      >
        {isSaving ? (
          <Loader2 className="animate-spin" size={16} aria-hidden="true" />
        ) : (
          <Save size={16} aria-hidden="true" />
        )}
        Salva scheda
      </button>
    </form>
  );
}
