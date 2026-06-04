"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MailPlus, Shield } from "lucide-react";

type FamilyUser = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "member" | "viewer";
};

type FamilyInvite = {
  id: string;
  email: string;
  role: "member" | "viewer";
  expiresAt: string;
};

type FamilyAccessManagerProps = {
  currentUserId: string;
  invites: FamilyInvite[];
  users: FamilyUser[];
};

const roleLabels = {
  owner: "Proprietario",
  member: "Collaboratore",
  viewer: "Sola lettura",
};

export function FamilyAccessManager({
  currentUserId,
  invites,
  users,
}: FamilyAccessManagerProps) {
  const router = useRouter();
  const [isInviting, setIsInviting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [savingRoleId, setSavingRoleId] = useState("");

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsInviting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const response = await fetch("/api/family/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    const result = await response.json();

    setIsInviting(false);

    if (!response.ok) {
      setError(result.error ?? "Non sono riuscita a inviare l'invito.");
      return;
    }

    form.reset();
    setMessage(result.message ?? "Invito inviato.");
    router.refresh();
  }

  async function updateRole(userId: string, role: string) {
    setSavingRoleId(userId);
    setError("");
    setMessage("");

    const response = await fetch(`/api/family/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const result = await response.json();

    setSavingRoleId("");

    if (!response.ok) {
      setError(result.error ?? "Non sono riuscita a cambiare ruolo.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-[#dbe7fb] text-[#375479]">
          <Shield size={20} aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase text-[#7a6f68]">
            Accessi famiglia
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#6c5f57]">
            Invita familiari e assegna permessi.
          </p>
        </div>
      </div>

      <form className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]" onSubmit={invite}>
        <input
          className="h-10 rounded-md border border-[#ded4cb] bg-white px-3 text-sm outline-none focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
          name="email"
          placeholder="email@esempio.it"
          required
          type="email"
        />
        <select
          className="h-10 rounded-md border border-[#ded4cb] bg-white px-3 text-sm outline-none focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
          name="role"
          defaultValue="member"
        >
          <option value="member">Collaboratore</option>
          <option value="viewer">Sola lettura</option>
        </select>
        <button
          className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#315a45] px-4 text-sm font-semibold text-white transition hover:bg-[#274737] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isInviting}
          type="submit"
        >
          {isInviting ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <MailPlus size={16} aria-hidden="true" />
          )}
          Invita
        </button>
      </form>

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

      <div className="space-y-2">
        {users.map((user) => (
          <div
            className="flex flex-col justify-between gap-2 rounded-md bg-[#fffaf6] p-3 sm:flex-row sm:items-center"
            key={user.id}
          >
            <div>
              <p className="text-sm font-semibold text-[#29302d]">
                {user.name}
              </p>
              <p className="text-xs text-[#6c5f57]">
                {user.email} · {roleLabels[user.role]}
              </p>
            </div>
            {user.role === "owner" || user.id === currentUserId ? (
              <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-[#4f5c55]">
                {roleLabels[user.role]}
              </span>
            ) : (
              <select
                className="h-9 rounded-md border border-[#ded4cb] bg-white px-2 text-sm outline-none focus:border-[#789888] focus:ring-2 focus:ring-[#d9eadf]"
                defaultValue={user.role}
                disabled={savingRoleId === user.id}
                onChange={(event) => updateRole(user.id, event.target.value)}
              >
                <option value="member">Collaboratore</option>
                <option value="viewer">Sola lettura</option>
              </select>
            )}
          </div>
        ))}
      </div>

      {invites.length > 0 ? (
        <div className="rounded-md border border-[#eee5dd] bg-[#fffdfb] p-3">
          <p className="text-xs font-semibold uppercase text-[#7a6f68]">
            Inviti in attesa
          </p>
          <div className="mt-2 space-y-1">
            {invites.map((invite) => (
              <p className="text-sm text-[#6c5f57]" key={invite.id}>
                {invite.email} · {roleLabels[invite.role]} · scade il{" "}
                {new Intl.DateTimeFormat("it-IT").format(
                  new Date(invite.expiresAt)
                )}
              </p>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
