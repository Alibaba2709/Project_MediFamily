import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getCurrentUser } from "@/app/lib/auth";
import { connectMongo } from "@/app/lib/mongodb";
import { canEditHealth, forbidden } from "@/app/lib/permissions";
import { todayDateKey } from "@/app/lib/medications";
import { Medication } from "@/app/models/Medication";
import { MedicationIntake } from "@/app/models/MedicationIntake";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user?.emailVerifiedAt) {
    return NextResponse.json({ error: "Non autorizzata." }, { status: 401 });
  }

  if (!canEditHealth(user)) return forbidden();

  const body = await request.json();
  const medicationId = String(body.medicationId ?? "");
  const intakeTime = String(body.intakeTime ?? "").trim();
  const intakeDate = String(body.intakeDate ?? todayDateKey()).trim();
  const status = String(body.status ?? "").trim();

  if (
    !mongoose.Types.ObjectId.isValid(medicationId) ||
    !/^\d{2}:\d{2}$/.test(intakeTime) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(intakeDate) ||
    !["taken", "skipped"].includes(status)
  ) {
    return NextResponse.json({ error: "Dati non validi." }, { status: 400 });
  }

  await connectMongo();

  const medication = await Medication.findOne({
    _id: medicationId,
    familyId: user.familyId,
  });

  if (!medication) {
    return NextResponse.json(
      { error: "Farmaco non trovato." },
      { status: 404 }
    );
  }

  const intake = await MedicationIntake.findOneAndUpdate(
    {
      familyId: user.familyId,
      medicationId,
      intakeDate,
      intakeTime,
    },
    {
      familyId: user.familyId,
      medicationId,
      memberName: medication.memberName,
      medicationName: medication.name,
      intakeDate,
      intakeTime,
      status,
    },
    { new: true, upsert: true, runValidators: true }
  );

  return NextResponse.json(intake);
}
