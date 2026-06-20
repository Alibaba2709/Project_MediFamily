import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectMongo } from "@/app/lib/mongodb";
import { getCurrentUser } from "@/app/lib/auth";
import { canEditHealth, forbidden } from "@/app/lib/permissions";
import { HealthDocument } from "@/app/models/HealthDocument";
import { Visit } from "@/app/models/Visit";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user?.emailVerifiedAt) {
    return NextResponse.json({ error: "Non autorizzata." }, { status: 401 });
  }

  if (!canEditHealth(user)) return forbidden();

  const body = await request.json();
  const visitId = String(body.visitId ?? "").trim();

  if (!mongoose.Types.ObjectId.isValid(visitId)) {
    return NextResponse.json({ error: "Visita non valida." }, { status: 400 });
  }

  if (!body.fileData || !body.fileName) {
    return NextResponse.json(
      { error: "La ricevuta e obbligatoria." },
      { status: 400 }
    );
  }

  if (body.fileSize && Number(body.fileSize) > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File troppo grande. Il limite e 2MB." },
      { status: 400 }
    );
  }

  await connectMongo();

  const visit = await Visit.findOne({
    _id: visitId,
    familyId: user.familyId,
    $or: [
      { status: { $in: ["booked", "paid", "completed"] } },
      { status: { $exists: false } },
    ],
  });

  if (!visit) {
    return NextResponse.json(
      { error: "Visita non trovata." },
      { status: 404 }
    );
  }

  const existingReceipt = await HealthDocument.exists({
    familyId: user.familyId,
    visitId,
    category: "pagamento",
  });

  if (existingReceipt) {
    return NextResponse.json(
      { error: "Questa visita ha gia una ricevuta collegata." },
      { status: 409 }
    );
  }

  const document = await HealthDocument.create({
    familyId: user.familyId,
    memberName: visit.memberName,
    visitId,
    title: `Ricevuta pagamento - ${visit.title}`,
    category: "pagamento",
    paymentDate: body.paymentDate || new Date(),
    amount: body.amount || body.amount === 0 ? Number(body.amount) : undefined,
    fileName: String(body.fileName).trim(),
    fileType: body.fileType ? String(body.fileType).trim() : undefined,
    fileSize: body.fileSize ? Number(body.fileSize) : undefined,
    fileData: String(body.fileData),
    notes: body.notes ? String(body.notes).trim() : undefined,
  });

  if (!visit.status || visit.status === "booked") {
    visit.status = "paid";
    await visit.save();
  }

  return NextResponse.json(document, { status: 201 });
}
