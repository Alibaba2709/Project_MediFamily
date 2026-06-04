import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectMongo } from "@/app/lib/mongodb";
import { getCurrentUser } from "@/app/lib/auth";
import { Visit } from "@/app/models/Visit";

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
    return NextResponse.json({ error: "Invalid visit id" }, { status: 400 });
  }

  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const memberName = String(body.memberName ?? "").trim();

  if (!title || !memberName || !body.visitDate) {
    return NextResponse.json(
      { error: "memberName, title and visitDate are required" },
      { status: 400 }
    );
  }

  const visit = await Visit.findOneAndUpdate(
    { _id: id, familyId: user.familyId },
    {
      familyId: user.familyId,
      memberName,
      title,
      doctor: body.doctor ? String(body.doctor).trim() : undefined,
      location: body.location ? String(body.location).trim() : undefined,
      visitDate: body.visitDate,
      visitTime: body.visitTime ? String(body.visitTime).trim() : undefined,
      paymentDueDate: body.paymentDueDate || undefined,
      cancellationDueDate: body.cancellationDueDate || undefined,
      price: body.price || body.price === 0 ? Number(body.price) : undefined,
      notes: body.notes ? String(body.notes).trim() : undefined,
      status: body.status ?? "booked",
    },
    { new: true, runValidators: true }
  );

  if (!visit) {
    return NextResponse.json({ error: "Visit not found" }, { status: 404 });
  }

  return NextResponse.json(visit);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user?.emailVerifiedAt) {
    return NextResponse.json({ error: "Non autorizzata." }, { status: 401 });
  }

  await connectMongo();

  const { id } = await context.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid visit id" }, { status: 400 });
  }

  const visit = await Visit.findOneAndDelete({
    _id: id,
    familyId: user.familyId,
  });

  if (!visit) {
    return NextResponse.json({ error: "Visit not found" }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}
