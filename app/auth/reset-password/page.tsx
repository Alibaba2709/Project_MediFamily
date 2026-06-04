import { AuthShell } from "@/app/components/AuthShell";
import { ResetPasswordForm } from "@/app/components/ResetPasswordForm";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token = "" } = await searchParams;

  return (
    <AuthShell
      title="Scegli una nuova password."
      subtitle="Il link di reset scade dopo 1 ora e invalida le sessioni precedenti."
    >
      <ResetPasswordForm token={token} />
    </AuthShell>
  );
}
