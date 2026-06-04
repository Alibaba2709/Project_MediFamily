import Link from "next/link";
import { AuthShell } from "@/app/components/AuthShell";
import { ResendVerificationButton } from "@/app/components/ResendVerificationButton";
import { requireUser } from "@/app/lib/auth";

export default async function VerifyEmailSentPage() {
  const user = await requireUser();

  return (
    <AuthShell
      title="Verifica la tua email."
      subtitle="Prima di entrare nella dashboard, confermiamo che l'indirizzo appartenga davvero a te."
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-[#947b6a]">
            Email da verificare
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-[#29302d]">
            {user.email}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#6c5f57]">
            In produzione qui invieremo una vera email. In sviluppo puoi usare
            il pulsante sotto per generare il link.
          </p>
        </div>

        <ResendVerificationButton />

        <Link
          className="block text-center text-sm font-semibold text-[#5573ad] underline"
          href="/auth/login"
        >
          Torna al login
        </Link>
      </div>
    </AuthShell>
  );
}
