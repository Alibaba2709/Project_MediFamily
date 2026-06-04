import { AuthShell } from "@/app/components/AuthShell";
import { RegisterForm } from "@/app/components/RegisterForm";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Organizza la salute del tuo nucleo familiare."
      subtitle="Crea un account, verifica l'email e collega visite, ricette, farmaci e documenti a una famiglia privata."
    >
      <RegisterForm />
    </AuthShell>
  );
}
