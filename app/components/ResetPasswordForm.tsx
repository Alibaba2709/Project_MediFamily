"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { PasswordField } from "@/app/components/PasswordField";

type ResetPasswordFormProps = {
  token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...Object.fromEntries(formData), token }),
    });
    const result = await response.json();

    setIsSaving(false);

    if (!response.ok) {
      setError(result.error ?? "Reset password non riuscito.");
      return;
    }

    setSuccess(result.message ?? "Password aggiornata.");
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <p className="text-sm font-medium text-[#947b6a]">Nuova password</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#29302d]">
          Imposta una nuova password
        </h2>
      </div>

      <PasswordField label="Password" name="password" required />
      <PasswordField
        label="Conferma password"
        name="passwordConfirm"
        required
      />

      {error ? (
        <p className="rounded-md bg-[#fff7f5] px-3 py-2 text-sm font-medium text-[#9f4d46]">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="rounded-md bg-[#f6fbf7] px-3 py-2 text-sm font-medium text-[#315a45]">
          {success}{" "}
          <Link className="underline" href="/auth/login">
            Accedi
          </Link>
        </p>
      ) : null}

      <button
        className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#315a45] px-4 text-sm font-semibold text-white transition hover:bg-[#274737]"
        disabled={isSaving || !token}
        type="submit"
      >
        {isSaving ? <Loader2 className="animate-spin" size={17} /> : <KeyRound size={17} />}
        Salva password
      </button>
    </form>
  );
}
