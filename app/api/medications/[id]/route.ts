import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectMongo } from "@/app/lib/mongodb";
import { getCurrentUser } from "@/app/lib/auth";
import { Medication } from "@/app/models/Medication";

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
    return NextResponse.json(
      { error: "Invalid medication id" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const memberName = String(body.memberName ?? "").trim();

  if (!name || !memberName) {
    return NextResponse.json(
      { error: "memberName and name are required" },
      { status: 400 }
    );
  }

  const medication = await Medication.findOneAndUpdate(
    { _id: id, familyId: user.familyId },
    {
      familyId: user.familyId,
      memberName,
      name,
      dosage: body.dosage ? String(body.dosage).trim() : undefined,
      schedule: body.schedule ? String(body.schedule).trim() : undefined,
      startDate: body.startDate || undefined,
      active: body.active ?? true,
      notes: body.notes ? String(body.notes).trim() : undefined,
    },
    { new: true, runValidators: true }
  );

  if (!medication) {
    return NextResponse.json(
      { error: "Medication not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(medication);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user?.emailVerifiedAt) {
    return NextResponse.json({ error: "Non autorizzata." }, { status: 401 });
  }

  await connectMongo();

  const { id } = await context.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Invalid medication id" },
      { status: 400 }
    );
  }

  const medication = await Medication.findOneAndDelete({
    _id: id,
    familyId: user.familyId,
  });

  if (!medication) {
    return NextResponse.json(
      { error: "Medication not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ deleted: true });
}
