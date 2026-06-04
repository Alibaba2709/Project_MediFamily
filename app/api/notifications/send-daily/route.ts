import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectMongo } from "@/app/lib/mongodb";
import { sendEmail } from "@/app/lib/email";
import { HealthDocument } from "@/app/models/HealthDocument";
import { Recipe } from "@/app/models/Recipe";
import { User } from "@/app/models/User";
import { Visit } from "@/app/models/Visit";

type StoredFamily = {
  key: string;
  name?: string;
  notificationSettings?: {
    emailEnabled?: boolean;
    visitDaysBefore?: number;
    recipeDaysBefore?: number;
    paymentEnabled?: boolean;
    cancellationEnabled?: boolean;
    recipeEnabled?: boolean;
    documentEnabled?: boolean;
  };
};

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function withinDays(value: Date, days: number) {
  const today = startOfDay(new Date());
  const limit = new Date(today);
  limit.setDate(limit.getDate() + days);
  const date = startOfDay(value);

  return date >= today && date <= limit;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

async function sendDailyNotifications(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  const querySecret = new URL(request.url).searchParams.get("secret");

  if (
    process.env.CRON_SECRET &&
    secret !== process.env.CRON_SECRET &&
    querySecret !== process.env.CRON_SECRET
  ) {
    return NextResponse.json({ error: "Non autorizzata." }, { status: 401 });
  }

  await connectMongo();

  const families = await mongoose.connection
    .collection("families")
    .find<StoredFamily>({
      "notificationSettings.emailEnabled": { $ne: false },
    })
    .toArray();
  let sent = 0;

  for (const family of families) {
    const settings = family.notificationSettings ?? {};
    const [visits, recipes, documents, users] = await Promise.all([
      Visit.find({ familyId: family.key, status: "booked" }),
      Recipe.find({ familyId: family.key }),
      HealthDocument.find({ familyId: family.key }).select("visitId"),
      User.find({
        familyId: family.key,
        emailVerifiedAt: { $exists: true },
        role: { $in: ["owner", "member"] },
      }),
    ]);
    const linkedVisitIds = new Set(
      documents.map((document) => String(document.visitId ?? "")).filter(Boolean)
    );
    const lines: string[] = [];

    visits.forEach((visit) => {
      if (withinDays(visit.visitDate, settings.visitDaysBefore ?? 1)) {
        lines.push(
          `Visita: ${visit.memberName} - ${visit.title} - ${formatDate(
            visit.visitDate
          )}`
        );
      }

      if (
        settings.paymentEnabled !== false &&
        visit.paymentDueDate &&
        withinDays(visit.paymentDueDate, 2)
      ) {
        lines.push(
          `Pagamento: ${visit.memberName} - ${visit.title} - entro ${formatDate(
            visit.paymentDueDate
          )}`
        );
      }

      if (
        settings.cancellationEnabled !== false &&
        visit.cancellationDueDate &&
        withinDays(visit.cancellationDueDate, 2)
      ) {
        lines.push(
          `Disdetta: ${visit.memberName} - ${visit.title} - entro ${formatDate(
            visit.cancellationDueDate
          )}`
        );
      }

      if (
        settings.documentEnabled !== false &&
        withinDays(visit.visitDate, 7) &&
        !linkedVisitIds.has(String(visit._id))
      ) {
        lines.push(`Documenti da collegare: ${visit.memberName} - ${visit.title}`);
      }
    });

    if (settings.recipeEnabled !== false) {
      recipes.forEach((recipe) => {
        if (
          recipe.renewalDate &&
          withinDays(recipe.renewalDate, settings.recipeDaysBefore ?? 7)
        ) {
          lines.push(
            `Ricetta: ${recipe.memberName} - ${recipe.medicationName} - entro ${formatDate(
              recipe.renewalDate
            )}`
          );
        }
      });
    }

    if (lines.length === 0) continue;

    for (const user of users) {
      const htmlLines = lines.map((line) => `<li>${line}</li>`).join("");
      const result = await sendEmail({
        to: user.email,
        subject: `Promemoria MediFamily - ${family.name ?? "Nucleo familiare"}`,
        text: lines.join("\n"),
        html: `
          <div style="font-family: Arial, sans-serif; color: #29302d; line-height: 1.6">
            <h1 style="color: #5573ad">Promemoria MediFamily</h1>
            <p>Ecco le cose da seguire per ${family.name ?? "il tuo nucleo"}.</p>
            <ul>${htmlLines}</ul>
          </div>
        `,
      });

      if (result.ok) sent += 1;
    }
  }

  return NextResponse.json({ sent });
}

export async function GET(request: Request) {
  return sendDailyNotifications(request);
}

export async function POST(request: Request) {
  return sendDailyNotifications(request);
}
