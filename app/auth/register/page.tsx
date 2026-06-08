import type { Metadata } from "next";
import { AuthShell } from "@/app/components/AuthShell";
import { RegisterForm } from "@/app/components/RegisterForm";

export const metadata: Metadata = {
  title: "Registrati",
  description:
    "Crea un account MediFamily per organizzare visite, ricette, farmaci, documenti e promemoria del tuo nucleo familiare.",
  alternates: {
    canonical: "/auth/register",
  },
};

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
