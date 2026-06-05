"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, Mail, Save } from "lucide-react";
import { PasswordField } from "@/app/components/PasswordField";

type FormStatus = {
  error: string;
  message: string;
  isSaving: boolean;
};

const initialStatus: FormStatus = {
  error: "",
  message: "",
  isSaving: false,
};

async function readResponse(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export function AccountSecurityForms() {
  const router = useRouter();
  const [emailStatus, setEmailStatus] = useState<FormStatus>(initialStatus);
  const [passwordStatus, setPasswordStatus] =
    useState<FormStatus>(initialStatus);

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailStatus({ ...initialStatus, isSaving: true });

    const form = event.currentTarget;
    const formData = new FormData(form);
    const response = await fetch("/api/account/email", {
      body: JSON.stringify(Object.fromEntries(formData)),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    const result = await readResponse(response);

    if (!response.ok) {
      setEmailStatus({
        error: result.error ?? "Non sono riuscita ad aggiornare l'email.",
        message: "",
        isSaving: false,
      });
      return;
    }

    setEmailStatus({
      error: "",
      message: result.message ?? "Email aggiornata.",
      isSaving: false,
    });
    form.reset();

    if (result.redirectTo) {
      router.push(result.redirectTo);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordStatus({ ...initialStatus, isSaving: true });

    const form = event.currentTarget;
    const formData = new FormData(form);
    const response = await fetch("/api/account/password", {
      body: JSON.stringify(Object.fromEntries(formData)),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    const result = await readResponse(response);

    if (!response.ok) {
      setPasswordStatus({
        error: result.error ?? "Non sono riuscita ad aggiornare la password.",
        message: "",
        isSaving: false,
      });
      return;
    }

    setPasswordStatus({
      error: "",
      message: result.message ?? "Password aggiornata.",
      isSaving: false,
    });
    form.reset();
  }

  return (
    <div className="mt-6 space-y-3 border-t border-[#eee5dd] pt-5">
      <details className="rounded-lg border border-[#eadfd7] bg-[#fffaf6] p-3">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-[#315a45] marker:hidden">
          <Mail size={16} aria-hidden="true" />
          Cambia email
        </summary>
        <form className="mt-4 space-y-3" onSubmit={handleEmailSubmit}>
          <PasswordField
            label="Password attuale"
            name="currentPassword"
            required
          />
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[#4f5c55]">
              Nuova email
            </span>
            <input
              className="h-11 w-full rounded-md border border-[#ded4cb] px-3 text-sm outline-none transition focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
              name="email"
              required
              type="email"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[#4f5c55]">
              Conferma nuova email
            </span>
            <input
              className="h-11 w-full rounded-md border border-[#ded4cb] px-3 text-sm outline-none transition focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
              name="emailConfirm"
              required
              type="email"
            />
          </label>

          {emailStatus.error ? (
            <p className="rounded-md border border-[#edc9c3] bg-[#fff7f5] px-3 py-2 text-sm font-medium text-[#7f5146]">
              {emailStatus.error}
            </p>
          ) : null}
          {emailStatus.message ? (
            <p className="rounded-md border border-[#d5e0d8] bg-[#f6fbf7] px-3 py-2 text-sm font-medium text-[#315a45]">
              {emailStatus.message}
            </p>
          ) : null}

          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#315a45] px-3 text-sm font-semibold text-white transition hover:bg-[#274737] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={emailStatus.isSaving}
            type="submit"
          >
            {emailStatus.isSaving ? (
              <Loader2 className="animate-spin" size={16} aria-hidden="true" />
            ) : (
              <Save size={16} aria-hidden="true" />
            )}
            Salva email
          </button>
        </form>
      </details>

      <details className="rounded-lg border border-[#eadfd7] bg-[#fffaf6] p-3">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-[#315a45] marker:hidden">
          <KeyRound size={16} aria-hidden="true" />
          Cambia password
        </summary>
        <form className="mt-4 space-y-3" onSubmit={handlePasswordSubmit}>
          <PasswordField
            label="Password attuale"
            name="currentPassword"
            required
          />
          <PasswordField label="Nuova password" name="password" required />
          <PasswordField
            label="Conferma nuova password"
            name="passwordConfirm"
            required
          />

          {passwordStatus.error ? (
            <p className="rounded-md border border-[#edc9c3] bg-[#fff7f5] px-3 py-2 text-sm font-medium text-[#7f5146]">
              {passwordStatus.error}
            </p>
          ) : null}
          {passwordStatus.message ? (
            <p className="rounded-md border border-[#d5e0d8] bg-[#f6fbf7] px-3 py-2 text-sm font-medium text-[#315a45]">
              {passwordStatus.message}
            </p>
          ) : null}

          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#315a45] px-3 text-sm font-semibold text-white transition hover:bg-[#274737] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={passwordStatus.isSaving}
            type="submit"
          >
            {passwordStatus.isSaving ? (
              <Loader2 className="animate-spin" size={16} aria-hidden="true" />
            ) : (
              <Save size={16} aria-hidden="true" />
            )}
            Salva password
          </button>
        </form>
      </details>
    </div>
  );
}
