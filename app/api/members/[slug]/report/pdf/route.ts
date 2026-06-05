import { NextResponse } from "next/server";
import { connectMongo } from "@/app/lib/mongodb";
import { getCurrentUser } from "@/app/lib/auth";
import { getFamilyMembers, memberSlug } from "@/app/lib/family";
import {
  getMedicationTimes,
  medicationTimeSortValue,
} from "@/app/lib/medications";
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
    month: "long",
    year: "numeric",
  }).format(value);
}

function formatMoney(value?: number) {
  if (value === undefined) return "importo non impostato";

  return new Intl.NumberFormat("it-IT", {
    currency: "EUR",
    style: "currency",
  }).format(value);
}

function pdfEscape(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
}

function wrapLine(value: string, maxLength = 88) {
  const words = value.split(" ");
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    if (`${line} ${word}`.trim().length > maxLength) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = `${line} ${word}`.trim();
    }
  }

  if (line) lines.push(line);
  return lines;
}

function buildPdf(lines: string[]) {
  const pageWidth = 595;
  const pageHeight = 842;
  const marginX = 44;
  const startY = 790;
  const lineHeight = 16;
  const linesPerPage = Math.floor((startY - 52) / lineHeight);
  const pages: string[][] = [];

  for (let index = 0; index < lines.length; index += linesPerPage) {
    pages.push(lines.slice(index, index + linesPerPage));
  }

  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push(
    `<< /Type /Pages /Kids [${pages
      .map((_page, index) => `${3 + index * 2} 0 R`)
      .join(" ")}] /Count ${pages.length} >>`
  );

  pages.forEach((pageLines, pageIndex) => {
    const pageObjectNumber = 3 + pageIndex * 2;
    const contentObjectNumber = pageObjectNumber + 1;
    const content = [
      "BT",
      "/F1 11 Tf",
      "14 TL",
      `${marginX} ${startY} Td`,
      ...pageLines.flatMap((line, index) => [
        index === 0 ? "" : "T*",
        `(${pdfEscape(line)}) Tj`,
      ]),
      "ET",
    ]
      .filter(Boolean)
      .join("\n");

    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${3 + pages.length * 2} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`
    );
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  });

  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  const pdfParts = ["%PDF-1.4\n"];
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdfParts.join(""), "utf8"));
    pdfParts.push(`${index + 1} 0 obj\n${object}\nendobj\n`);
  });

  const xrefOffset = Buffer.byteLength(pdfParts.join(""), "utf8");
  pdfParts.push(`xref\n0 ${objects.length + 1}\n`);
  pdfParts.push("0000000000 65535 f \n");
  offsets.slice(1).forEach((offset) => {
    pdfParts.push(`${String(offset).padStart(10, "0")} 00000 n \n`);
  });
  pdfParts.push(
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  );

  return Buffer.from(pdfParts.join(""), "utf8");
}

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user?.emailVerifiedAt) {
    return NextResponse.json({ error: "Non autorizzata." }, { status: 401 });
  }

  const { slug } = await context.params;
  const members = await getFamilyMembers(user);
  const member = members.find((item) => memberSlug(item.name) === slug);

  if (!member) {
    return NextResponse.json(
      { error: "Membro famiglia non trovato." },
      { status: 404 }
    );
  }

  await connectMongo();
  const [visits, recipes, medications, documents] = await Promise.all([
    Visit.find({ familyId: user.familyId, memberName: member.name }).sort({
      visitDate: -1,
    }),
    Recipe.find({ familyId: user.familyId, memberName: member.name }).sort({
      renewalDate: -1,
    }),
    Medication.find({ familyId: user.familyId, memberName: member.name }).sort({
      createdAt: -1,
    }),
    HealthDocument.find({ familyId: user.familyId, memberName: member.name })
      .sort({ createdAt: -1 })
      .select("-fileData"),
  ]);
  const sortedMedications = [...medications].sort((a, b) =>
    medicationTimeSortValue(getMedicationTimes(a)[0]).localeCompare(
      medicationTimeSortValue(getMedicationTimes(b)[0])
    )
  );

  const lines = [
    `MediFamily - Report salute`,
    member.name,
    `Generato il ${formatDate(new Date())}`,
    "",
    "SCHEDA SANITARIA",
    ...(member.birthDate
      ? [`Data di nascita: ${formatDate(new Date(member.birthDate))}`]
      : []),
    ...(member.fiscalCode ? [`Codice fiscale: ${member.fiscalCode}`] : []),
    ...(member.bloodType ? [`Gruppo sanguigno: ${member.bloodType}`] : []),
    ...(member.primaryDoctor ? [`Medico di base: ${member.primaryDoctor}`] : []),
    ...(member.emergencyContactName || member.emergencyContactPhone
      ? [
          `Contatto emergenza: ${[
            member.emergencyContactName,
            member.emergencyContactPhone,
          ]
            .filter(Boolean)
            .join(" - ")}`,
        ]
      : []),
    ...(member.allergies ? [`Allergie: ${member.allergies}`] : []),
    ...(member.conditions ? [`Patologie: ${member.conditions}`] : []),
    ...(member.healthNotes ? [`Note sanitarie: ${member.healthNotes}`] : []),
    ...(member.birthDate ||
    member.fiscalCode ||
    member.bloodType ||
    member.primaryDoctor ||
    member.emergencyContactName ||
    member.emergencyContactPhone ||
    member.allergies ||
    member.conditions ||
    member.healthNotes
      ? []
      : ["Nessun dato registrato."]),
    "",
    "VISITE",
    ...(visits.length
      ? visits.flatMap((visit) => [
          `${visit.title} - ${formatDate(visit.visitDate)}${visit.visitTime ? ` - ${visit.visitTime}` : ""}`,
          visit.notes ? `Note: ${visit.notes}` : "",
        ])
      : ["Nessun dato registrato."]),
    "",
    "RICETTE",
    ...(recipes.length
      ? recipes.flatMap((recipe) => [
          `${recipe.medicationName} - codice: ${recipe.recipeCode || "non impostato"} - rinnovo: ${formatDate(recipe.renewalDate)}`,
          recipe.notes ? `Note: ${recipe.notes}` : "",
        ])
      : ["Nessun dato registrato."]),
    "",
    "FARMACI",
    ...(sortedMedications.length
      ? sortedMedications.flatMap((medication) => [
          [
            medication.name,
            medication.dosage || "dosaggio non impostato",
            getMedicationTimes(medication).join(", ") ||
              "orario non impostato",
            medication.stockQuantity !== undefined
              ? `scorta: ${medication.stockQuantity} ${medication.stockUnit || "dosi"}`
              : "scorta non impostata",
            `fine terapia: ${formatDate(medication.endDate)}`,
          ].join(" - "),
          medication.notes ? `Note: ${medication.notes}` : "",
        ])
      : ["Nessun dato registrato."]),
    "",
    "DOCUMENTI",
    ...(documents.length
      ? documents.flatMap((document) => [
          document.category === "pagamento"
            ? `${document.title} - pagamento - ${formatMoney(document.amount)} - ${document.fileName || "scheda senza file"}`
            : `${document.title} - ${document.category} - ${document.fileName || "scheda senza file"}`,
          document.notes ? `Note: ${document.notes}` : "",
        ])
      : ["Nessun dato registrato."]),
  ]
    .filter((line) => line !== "")
    .flatMap((line) => wrapLine(String(line)));

  const pdf = buildPdf(lines);
  const fileName = `medifamily-${memberSlug(member.name)}-report.pdf`;

  return new Response(pdf, {
    headers: {
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Type": "application/pdf",
    },
  });
}
