import Link from "next/link";
import { AuthShell } from "@/app/components/AuthShell";
import { verifyEmailToken } from "@/app/lib/auth";

type VerifyEmailPageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const { token = "" } = await searchParams;
  const verified = token ? await verifyEmailToken(token) : false;

  return (
    <AuthShell
      title={verified ? "Email verificata." : "Link non valido."}
      subtitle={
        verified
          ? "Ora puoi usare MediFamily e accedere alla dashboard del tuo nucleo familiare."
          : "Il link potrebbe essere scaduto. Puoi richiederne uno nuovo dalla pagina di verifica."
      }
    >
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-[#29302d]">
          {verified ? "Tutto pronto" : "Verifica non riuscita"}
        </h2>
        <Link
          className="flex h-11 items-center justify-center rounded-md bg-[#315a45] px-4 text-sm font-semibold text-white transition hover:bg-[#274737]"
          href={verified ? "/" : "/verify-email/sent"}
        >
          {verified ? "Vai alla dashboard" : "Richiedi nuovo link"}
        </Link>
      </div>
    </AuthShell>
  );
}
