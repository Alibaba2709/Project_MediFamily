"use client";

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";

export function ResendVerificationButton() {
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function resend() {
    setIsSending(true);
    setMessage("");
    setError("");

    const response = await fetch("/api/auth/resend-verification", {
      method: "POST",
    });
    const result = await response.json();

    setIsSending(false);

    if (!response.ok) {
      setError(result.error ?? "Invio non riuscito.");
      return;
    }

    setMessage(result.message ?? "Email inviata.");
  }

  return (
    <div className="space-y-3">
      <button
        className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#315a45] px-4 text-sm font-semibold text-white transition hover:bg-[#274737]"
        disabled={isSending}
        onClick={resend}
        type="button"
      >
        {isSending ? <Loader2 className="animate-spin" size={17} /> : <Mail size={17} />}
        Reinvia verifica
      </button>

      {error ? (
        <p className="rounded-md bg-[#fff7f5] px-3 py-2 text-sm font-medium text-[#9f4d46]">
          {error}
        </p>
      ) : null}

      {message ? (
        <div className="rounded-md border border-[#d5e0d8] bg-[#f6fbf7] p-3 text-sm text-[#315a45]">
          <p className="font-semibold">{message}</p>
        </div>
      ) : null}
    </div>
  );
}
