import { NextResponse } from "next/server";
import { connectMongo } from "@/app/lib/mongodb";
import { getCurrentUser } from "@/app/lib/auth";
import { HealthDocument } from "@/app/models/HealthDocument";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

export async function GET() {
  const user = await getCurrentUser();

  if (!user?.emailVerifiedAt) {
    return NextResponse.json({ error: "Non autorizzata." }, { status: 401 });
  }

  await connectMongo();

  const documents = await HealthDocument.find({ familyId: user.familyId })
    .sort({ createdAt: -1 })
    .select("-fileData");

  return NextResponse.json(documents);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user?.emailVerifiedAt) {
    return NextResponse.json({ error: "Non autorizzata." }, { status: 401 });
  }

  await connectMongo();

  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const memberName = String(body.memberName ?? "").trim();

  if (!title || !memberName) {
    return NextResponse.json(
      { error: "memberName and title are required" },
      { status: 400 }
    );
  }

  if (body.fileSize && Number(body.fileSize) > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 2MB" },
      { status: 400 }
    );
  }

  const document = await HealthDocument.create({
    familyId: user.familyId,
    memberName,
    visitId: body.visitId ? String(body.visitId).trim() : undefined,
    title,
    category: body.category ?? "altro",
    paymentDate: body.paymentDate || undefined,
    amount:
      body.amount || body.amount === 0 ? Number(body.amount) : undefined,
    fileName: body.fileName ? String(body.fileName).trim() : undefined,
    fileType: body.fileType ? String(body.fileType).trim() : undefined,
    fileSize: body.fileSize ? Number(body.fileSize) : undefined,
    fileData: body.fileData ? String(body.fileData) : undefined,
    notes: body.notes ? String(body.notes).trim() : undefined,
  });

  return NextResponse.json(document, { status: 201 });
}
