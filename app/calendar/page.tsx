import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock3 } from "lucide-react";
import { connectMongo } from "@/app/lib/mongodb";
import { requireVerifiedUser } from "@/app/lib/auth";
import { Visit } from "@/app/models/Visit";

type StoredVisit = {
  _id: { toString: () => string };
  memberName: string;
  title: string;
  location?: string;
  visitDate: Date;
  visitTime?: string;
  status?: "booked" | "paid" | "cancelled" | "completed";
};

async function getVisits(familyId: string) {
  try {
    await connectMongo();

    const visits = await Visit.find({ familyId })
      .sort({ visitDate: 1, visitTime: 1 })
      .lean<StoredVisit[]>();

    return visits.map((visit) => ({
      id: visit._id.toString(),
      memberName: visit.memberName,
      title: visit.title,
      location: visit.location,
      visitDate: visit.visitDate.toISOString(),
      visitTime: visit.visitTime,
      status: visit.status ?? "booked",
    }));
  } catch {
    return [];
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default async function CalendarPage() {
  const user = await requireVerifiedUser();
  const visits = await getVisits(user.familyId);

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
          <div className="flex items-start gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-[#dbe7fb] text-[#375479]">
              <CalendarDays size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#947b6a]">
                Agenda medica
              </p>
              <h1 className="mt-1 text-3xl font-semibold text-[#29302d]">
                Calendario visite
              </h1>
              <p className="mt-3 text-sm leading-6 text-[#6c5f57]">
                Vista ordinata delle visite salvate per tutta la famiglia.
              </p>
            </div>
          </div>
        </section>

        {visits.length > 0 ? (
          <section className="grid gap-3">
            {visits.map((visit) => (
              <article
                className="rounded-lg border border-[#eadfd7] bg-white p-4 shadow-sm"
                key={visit.id}
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="font-semibold text-[#29302d]">
                      {visit.title}
                    </h2>
                    <p className="mt-1 text-sm text-[#6c5f57]">
                      {visit.memberName}
                      {visit.location ? ` · ${visit.location}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#315a45]">
                    <Clock3 size={17} aria-hidden="true" />
                    {formatDate(visit.visitDate)}
                    {visit.visitTime ? ` · ${visit.visitTime}` : ""}
                  </div>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="rounded-lg border border-dashed border-[#d9cfc6] bg-white p-6 text-center shadow-sm">
            <CalendarDays
              size={28}
              className="mx-auto text-[#947b6a]"
              aria-hidden="true"
            />
            <h2 className="mt-3 text-base font-semibold text-[#29302d]">
              Nessuna visita in calendario
            </h2>
          </section>
        )}
      </div>
    </main>
  );
}
