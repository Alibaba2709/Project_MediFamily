import { AuthShell } from "@/app/components/AuthShell";
import { AcceptInviteForm } from "@/app/components/AcceptInviteForm";

type InvitePageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;

  return (
    <AuthShell
      title="Invito MediFamily"
      subtitle="Completa l'accesso per entrare nel nucleo familiare condiviso."
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-[#947b6a]">
            Accesso al nucleo
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-[#29302d]">
            Crea la tua password
          </h2>
        </div>
        <AcceptInviteForm token={token} />
      </div>
    </AuthShell>
  );
}
