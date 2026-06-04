import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectMongo } from "@/app/lib/mongodb";
import { getCurrentUser } from "@/app/lib/auth";
import { canEditHealth, forbidden } from "@/app/lib/permissions";
import {
  normalizeIntakeTimes,
  normalizeWeekdays,
} from "@/app/lib/medications";
import { Medication } from "@/app/models/Medication";

const frequencies = ["daily", "specific_days", "as_needed"];

function normalizeFrequency(value: unknown) {
  const frequency = String(value ?? "daily");
  return frequencies.includes(frequency) ? frequency : "daily";
}

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

  if (!canEditHealth(user)) return forbidden();

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
  const intakeTimes = normalizeIntakeTimes(body.intakeTimes, body.intakeTime);
  const frequency = normalizeFrequency(body.frequency);

  if (!name || !memberName) {
    return NextResponse.json(
      { error: "memberName and name are required" },
      { status: 400 }
    );
  }

  const setFields: Record<string, unknown> = {
    familyId: user.familyId,
    memberName,
    name,
    active: body.active ?? true,
    frequency,
    weekdays:
      frequency === "specific_days" ? normalizeWeekdays(body.weekdays) : [],
  };
  const unsetFields: Record<string, ""> = {};
  const setOptionalField = (field: string, value: unknown) => {
    const normalized = value === undefined ? "" : String(value).trim();

    if (normalized) {
      setFields[field] = normalized;
      return;
    }

    unsetFields[field] = "";
  };

  setOptionalField("dosage", body.dosage);
  setOptionalField("startDate", body.startDate);
  setOptionalField("endDate", body.endDate);
  setOptionalField("notes", body.notes);

  if (intakeTimes.length > 0) {
    setFields.intakeTimes = intakeTimes;
    setFields.intakeTime = intakeTimes[0];
  } else {
    unsetFields.intakeTimes = "";
    unsetFields.intakeTime = "";
  }

  if ("schedule" in body) {
    setOptionalField("schedule", body.schedule);
  }

  const update: Record<string, unknown> = { $set: setFields };

  if (Object.keys(unsetFields).length > 0) {
    update.$unset = unsetFields;
  }

  const medication = await Medication.findOneAndUpdate(
    { _id: id, familyId: user.familyId },
    update,
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

  if (!canEditHealth(user)) return forbidden();

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
