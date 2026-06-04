"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { PasswordField } from "@/app/components/PasswordField";

export function LoginForm() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    const result = await response.json();

    setIsSaving(false);

    if (!response.ok) {
      setError(result.error ?? "Accesso non riuscito.");
      return;
    }

    router.push(result.redirectTo ?? "/");
    router.refresh();
  }

  return (
    <form className="space-y-4"
    onSubmit={handleSubmit}
    method="post"
    action="/api/auth/login"
    >
      <div>
        <p className="text-sm font-medium text-[#947b6a]">Bentornata</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#29302d]">
          Accedi alla dashboard
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

      <PasswordField label="Password" name="password" required />

      <div className="flex justify-end">
        <Link
          className="text-sm font-semibold text-[#5573ad] underline"
          href="/auth/forgot-password"
        >
          Password dimenticata?
        </Link>
      </div>

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
        {isSaving ? <Loader2 className="animate-spin" size={17} /> : <LogIn size={17} />}
        Accedi
      </button>

      <p className="text-center text-sm text-[#6c5f57]">
        Non hai un account?{" "}
        <Link className="font-semibold text-[#5573ad] underline" href="/auth/register">
          Registrati
        </Link>
      </p>
    </form>
  );
}
