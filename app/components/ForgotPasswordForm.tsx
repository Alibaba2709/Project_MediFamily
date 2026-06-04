"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";

export function ForgotPasswordForm() {
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [resetLink, setResetLink] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setResetLink("");
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    const result = await response.json();

    setIsSaving(false);
    setMessage(result.message ?? "Controlla la tua email.");
    setResetLink(result.resetLink ?? "");
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
          {resetLink ? (
            <>
              <p className="mt-1">In sviluppo clicca questo link:</p>
              <Link className="mt-2 block break-all underline" href={resetLink}>
                {resetLink}
              </Link>
            </>
          ) : null}
        </div>
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
