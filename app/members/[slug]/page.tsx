import Link from "next/link";
import { ArrowLeft, ClipboardList, FileText, Pill, Stethoscope } from "lucide-react";
import { connectMongo } from "@/app/lib/mongodb";
import { requireVerifiedUser } from "@/app/lib/auth";
import { getFamilyMembers, memberSlug } from "@/app/lib/family";
import { Visit } from "@/app/models/Visit";
import { Recipe } from "@/app/models/Recipe";
import { Medication } from "@/app/models/Medication";
import { HealthDocument } from "@/app/models/HealthDocument";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

function formatDate(value?: Date) {
  if (!value) return "Non impostata";
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

export default async function MemberPage(context: RouteContext) {
  const user = await requireVerifiedUser();
  const members = await getFamilyMembers(user);
  const { slug } = await context.params;
  const member = members.find((item) => memberSlug(item.name) === slug);

  if (!member) {
    return (
      <main className="min-h-screen bg-[#fffaf6] px-5 py-6 text-[#2f3330] sm:px-8">
        <div className="mx-auto max-w-5xl">
          <Link href="/">Dashboard</Link>
          <p className="mt-6">Membro famiglia non trovato.</p>
        </div>
      </main>
    );
  }

  await connectMongo();
  const [visits, recipes, medications, documents] = await Promise.all([
    Visit.find({ familyId: user.familyId, memberName: member.name }).sort({
      visitDate: 1,
    }),
    Recipe.find({ familyId: user.familyId, memberName: member.name }).sort({
      renewalDate: 1,
    }),
    Medication.find({ familyId: user.familyId, memberName: member.name }).sort({
      createdAt: -1,
    }),
    HealthDocument.find({ familyId: user.familyId, memberName: member.name })
      .sort({ createdAt: -1 })
      .select("-fileData"),
  ]);

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
          <div className="flex items-center gap-3">
            <div
              className={`flex size-12 items-center justify-center rounded-lg ${member.tone} text-lg font-semibold text-[#313a35]`}
            >
              {member.name.slice(0, 1)}
            </div>
            <div>
              <p className="text-sm font-medium text-[#947b6a]">{member.role}</p>
              <h1 className="mt-1 text-3xl font-semibold text-[#29302d]">
                {member.name}
              </h1>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <ProfilePanel icon={Stethoscope} title="Visite">
            {visits.length ? (
              visits.map((visit) => (
                <p className="text-sm text-[#6c5f57]" key={String(visit._id)}>
                  {visit.title} · {formatDate(visit.visitDate)}
                  {visit.visitTime ? ` · ${visit.visitTime}` : ""}
                </p>
              ))
            ) : (
              <p className="text-sm text-[#6c5f57]">Nessuna visita.</p>
            )}
          </ProfilePanel>

          <ProfilePanel icon={ClipboardList} title="Ricette">
            {recipes.length ? (
              recipes.map((recipe) => (
                <p className="text-sm text-[#6c5f57]" key={String(recipe._id)}>
                  {recipe.medicationName} · {recipe.recipeCode || "senza codice"}
                </p>
              ))
            ) : (
              <p className="text-sm text-[#6c5f57]">Nessuna ricetta.</p>
            )}
          </ProfilePanel>

          <ProfilePanel icon={Pill} title="Farmaci">
            {medications.length ? (
              medications.map((medication) => (
                <p className="text-sm text-[#6c5f57]" key={String(medication._id)}>
                  {medication.name} · {medication.dosage || "dosaggio non impostato"}
                </p>
              ))
            ) : (
              <p className="text-sm text-[#6c5f57]">Nessun farmaco.</p>
            )}
          </ProfilePanel>

          <ProfilePanel icon={FileText} title="Documenti">
            {documents.length ? (
              documents.map((document) => (
                <p className="text-sm text-[#6c5f57]" key={String(document._id)}>
                  {document.title} · {document.category}
                </p>
              ))
            ) : (
              <p className="text-sm text-[#6c5f57]">Nessun documento.</p>
            )}
          </ProfilePanel>
        </section>
      </div>
    </main>
  );
}

function ProfilePanel({
  children,
  icon: Icon,
  title,
}: {
  children: React.ReactNode;
  icon: typeof Stethoscope;
  title: string;
}) {
  return (
    <div className="rounded-lg border border-[#eadfd7] bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Icon size={18} className="text-[#789888]" aria-hidden="true" />
        <h2 className="font-semibold text-[#29302d]">{title}</h2>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
