import { AuthShell } from "@/app/components/AuthShell";
import { LoginForm } from "@/app/components/LoginForm";

export default function LoginPage() {
  return (
    <AuthShell
      title="Rientra nella tua dashboard familiare."
      subtitle="Accedi per vedere solo il tuo nucleo, le tue scadenze e il tuo archivio salute."
    >
      <LoginForm />
    </AuthShell>
  );
}
