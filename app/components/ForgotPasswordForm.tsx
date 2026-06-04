"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";

export function ForgotPasswordForm() {
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    const result = await response.json();

    setIsSaving(false);

    if (!response.ok) {
      setError(result.error ?? "Invio email non riuscito.");
      return;
    }

    setMessage(result.message ?? "Controlla la tua email.");
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <p className="text-sm font-medium text-[#947b6a]">Recupero account</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#29302d]">
          Cambia password
        </h2>
      </div>

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

      {message ? (
        <div className="rounded-md border border-[#d5e0d8] bg-[#f6fbf7] p-3 text-sm text-[#315a45]">
          <p className="font-semibold">{message}</p>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-md bg-[#fff7f5] px-3 py-2 text-sm font-medium text-[#9f4d46]">
          {error}
        </p>
      ) : null}

      <button
        className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#315a45] px-4 text-sm font-semibold text-white transition hover:bg-[#274737]"
        disabled={isSaving}
        type="submit"
      >
        {isSaving ? <Loader2 className="animate-spin" size={17} /> : <KeyRound size={17} />}
        Invia link
      </button>

      <p className="text-center text-sm text-[#6c5f57]">
        Ricordi la password?{" "}
        <Link className="font-semibold text-[#5573ad] underline" href="/auth/login">
          Accedi
        </Link>
      </p>
    </form>
  );
}
