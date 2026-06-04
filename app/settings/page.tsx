import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";
import { requireVerifiedUser } from "@/app/lib/auth";
import { getFamilyMembers } from "@/app/lib/family";
import { FamilyMembersManager } from "@/app/components/FamilyMembersManager";

export default async function SettingsPage() {
  const user = await requireVerifiedUser();
  const members = await getFamilyMembers(user);

  return (
    <main className="min-h-screen bg-[#fffaf6] px-5 py-6 text-[#2f3330] sm:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          className="inline-flex h-10 items-center gap-2 rounded-md border border-[#e3d7cf] bg-white px-3 text-sm font-semibold text-[#4f5c55] shadow-sm transition hover:bg-[#f8f1ec]"
          href="/"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Dashboard
        </Link>

        <section className="rounded-lg border border-[#eadfd7] bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-[#faf7ff] text-[#5d527b]">
              <Settings size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#947b6a]">
                Account e nucleo
              </p>
              <h1 className="mt-1 text-3xl font-semibold text-[#29302d]">
                Impostazioni
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6c5f57]">
                Gestisci il tuo profilo e le informazioni principali del nucleo
                familiare.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-lg border border-[#eadfd7] bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase text-[#7a6f68]">
              Profilo
            </h2>
            <div className="mt-4 space-y-3 text-sm">
              <p>
                <span className="font-semibold text-[#29302d]">Nome:</span>{" "}
                <span className="text-[#6c5f57]">{user.name}</span>
              </p>
              <p>
                <span className="font-semibold text-[#29302d]">Email:</span>{" "}
                <span className="text-[#6c5f57]">{user.email}</span>
              </p>
              <p>
                <span className="font-semibold text-[#29302d]">Ruolo:</span>{" "}
                <span className="text-[#6c5f57]">{user.role}</span>
              </p>
            </div>
          </article>

          <article className="rounded-lg border border-[#eadfd7] bg-white p-5 shadow-sm">
            <FamilyMembersManager
              currentUserName={user.name}
              members={members}
            />
          </article>
        </section>
      </div>
    </main>
  );
}
