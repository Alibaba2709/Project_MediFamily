import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectMongo } from "@/app/lib/mongodb";
import { getCurrentUser } from "@/app/lib/auth";
import { HealthDocument } from "@/app/models/HealthDocument";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user?.emailVerifiedAt) {
    return NextResponse.json({ error: "Non autorizzata." }, { status: 401 });
  }

  await connectMongo();

  const { id } = await context.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid document id" }, { status: 400 });
  }

  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const memberName = String(body.memberName ?? "").trim();

  if (!title || !memberName) {
    return NextResponse.json(
      { error: "memberName and title are required" },
      { status: 400 }
    );
  }

  const update: Record<string, unknown> = {
    familyId: user.familyId,
    memberName,
    visitId: body.visitId ? String(body.visitId).trim() : undefined,
    title,
    category: body.category ?? "altro",
    paymentDate: body.paymentDate || undefined,
    amount:
      body.amount || body.amount === 0 ? Number(body.amount) : undefined,
    notes: body.notes ? String(body.notes).trim() : undefined,
  };

  if (body.fileData) {
    update.fileName = body.fileName ? String(body.fileName).trim() : undefined;
    update.fileType = body.fileType ? String(body.fileType).trim() : undefined;
    update.fileSize = body.fileSize ? Number(body.fileSize) : undefined;
    update.fileData = String(body.fileData);
  }

  const document = await HealthDocument.findOneAndUpdate(
    { _id: id, familyId: user.familyId },
    update,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  return NextResponse.json(document);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user?.emailVerifiedAt) {
    return NextResponse.json({ error: "Non autorizzata." }, { status: 401 });
  }

  await connectMongo();

  const { id } = await context.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid document id" }, { status: 400 });
  }

  const document = await HealthDocument.findOneAndDelete({
    _id: id,
    familyId: user.familyId,
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}
