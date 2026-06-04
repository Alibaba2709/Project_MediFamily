import { AuthShell } from "@/app/components/AuthShell";
import { ForgotPasswordForm } from "@/app/components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Recupera l'accesso senza stress."
      subtitle="Inserisci la tua email: MediFamily genera un link sicuro per impostare una nuova password."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
