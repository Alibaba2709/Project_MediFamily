"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";
import { PasswordField } from "@/app/components/PasswordField";

type AcceptInviteFormProps = {
  token: string;
};

export function AcceptInviteForm({ token }: AcceptInviteFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/family/invites/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        ...Object.fromEntries(formData),
      }),
    });
    const result = await response.json();

    setIsSaving(false);

    if (!response.ok) {
      setError(result.error ?? "Invito non valido.");
      return;
    }

    router.push(result.redirectTo ?? "/");
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block space-y-2">
        <span className="text-sm font-semibold text-[#4f5c55]">
          Nome e cognome
        </span>
        <input
          className="h-11 w-full rounded-md border border-[#ded4cb] px-3 text-sm outline-none transition focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
          name="name"
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

      <button
        className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#315a45] px-4 text-sm font-semibold text-white transition hover:bg-[#274737]"
        disabled={isSaving}
        type="submit"
      >
        {isSaving ? (
          <Loader2 className="animate-spin" size={17} />
        ) : (
          <UserPlus size={17} />
        )}
        Entra nel nucleo
      </button>
    </form>
  );
}
