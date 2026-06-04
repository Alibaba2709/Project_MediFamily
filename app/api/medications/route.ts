import { NextResponse } from "next/server";
import { connectMongo } from "@/app/lib/mongodb";
import { getCurrentUser } from "@/app/lib/auth";
import { canEditHealth, forbidden } from "@/app/lib/permissions";
import { Medication } from "@/app/models/Medication";

export async function GET() {
  const user = await getCurrentUser();

  if (!user?.emailVerifiedAt) {
    return NextResponse.json({ error: "Non autorizzata." }, { status: 401 });
  }

  if (!canEditHealth(user)) return forbidden();

  await connectMongo();

  const medications = await Medication.find({ familyId: user.familyId }).sort({
    createdAt: -1,
  });

  return NextResponse.json(medications);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user?.emailVerifiedAt) {
    return NextResponse.json({ error: "Non autorizzata." }, { status: 401 });
  }

  await connectMongo();

  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const memberName = String(body.memberName ?? "").trim();

  if (!name || !memberName) {
    return NextResponse.json(
      { error: "memberName and name are required" },
      { status: 400 }
    );
  }

  const medication = await Medication.create({
    familyId: user.familyId,
    memberName,
    name,
    dosage: body.dosage ? String(body.dosage).trim() : undefined,
    schedule: body.schedule ? String(body.schedule).trim() : undefined,
    startDate: body.startDate || undefined,
    active: body.active ?? true,
    notes: body.notes ? String(body.notes).trim() : undefined,
  });

  return NextResponse.json(medication, { status: 201 });
}
