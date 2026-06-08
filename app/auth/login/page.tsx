import type { Metadata } from "next";
import { AuthShell } from "@/app/components/AuthShell";
import { LoginForm } from "@/app/components/LoginForm";

export const metadata: Metadata = {
  title: "Accedi",
  description:
    "Accedi alla dashboard MediFamily per consultare visite, scadenze, ricette, farmaci e documenti sanitari della tua famiglia.",
  alternates: {
    canonical: "/auth/login",
  },
};

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
