"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Loader2, UserPlus } from "lucide-react";
import { PasswordField } from "@/app/components/PasswordField";

export function RegisterForm() {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    const result = await response.json().catch(() => ({
      error: "Errore del server durante la registrazione.",
    }));

    setIsSaving(false);

    if (!response.ok) {
      setError(result.error ?? "Registrazione non riuscita.");
      return;
    }

    setSuccess(result.message ?? "Account creato. Controlla la tua email.");
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <p className="text-sm font-medium text-[#947b6a]">Nuovo account</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#29302d]">
          Crea il tuo nucleo familiare
        </h2>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-[#4f5c55]">Nome</span>
        <input
          className="h-11 w-full rounded-md border border-[#ded4cb] px-3 text-sm outline-none transition focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
          name="name"
          placeholder="Nome e cognome"
          required
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-[#4f5c55]">
          Nome famiglia
        </span>
        <input
          className="h-11 w-full rounded-md border border-[#ded4cb] px-3 text-sm outline-none transition focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
          name="familyName"
          placeholder="Es. La mia famiglia"
          required
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-[#4f5c55]">Email</span>
        <input
          className="h-11 w-full rounded-md border border-[#ded4cb] px-3 text-sm outline-none transition focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
          name="email"
          placeholder="nome@email.it"
          type="email"
          required
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <PasswordField label="Password" name="password" required />
        <PasswordField
          label="Conferma password"
          name="passwordConfirm"
          required
        />
      </div>

      <p className="text-xs leading-5 text-[#6c5f57]">
        La password deve avere almeno 8 caratteri, maiuscola, minuscola e numero.
      </p>

      {error ? (
        <p className="rounded-md bg-[#fff7f5] px-3 py-2 text-sm font-medium text-[#9f4d46]">
          {error}
        </p>
      ) : null}

      {success ? (
        <div className="rounded-md border border-[#d5e0d8] bg-[#f6fbf7] p-3 text-sm text-[#315a45]">
          <p className="font-semibold">Account creato.</p>
          <p className="mt-1">{success}</p>
          <Link className="mt-2 block font-semibold underline" href="/auth/login">
            Vai al login
          </Link>
        </div>
      ) : null}

      <button
        className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#315a45] px-4 text-sm font-semibold text-white transition hover:bg-[#274737]"
        disabled={isSaving}
        type="submit"
      >
        {isSaving ? <Loader2 className="animate-spin" size={17} /> : <UserPlus size={17} />}
        Crea account
      </button>

      <p className="text-center text-sm text-[#6c5f57]">
        Hai gia un account?{" "}
        <Link className="font-semibold text-[#5573ad] underline" href="/auth/login">
          Accedi
        </Link>
      </p>
    </form>
  );
}
