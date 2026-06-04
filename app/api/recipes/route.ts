import { NextResponse } from "next/server";
import { connectMongo } from "@/app/lib/mongodb";
import { getCurrentUser } from "@/app/lib/auth";
import { canEditHealth, forbidden } from "@/app/lib/permissions";
import { Recipe } from "@/app/models/Recipe";

export async function GET() {
  const user = await getCurrentUser();

  if (!user?.emailVerifiedAt) {
    return NextResponse.json({ error: "Non autorizzata." }, { status: 401 });
  }

  if (!canEditHealth(user)) return forbidden();

  await connectMongo();

  const recipes = await Recipe.find({ familyId: user.familyId }).sort({
    createdAt: -1,
  });

  return NextResponse.json(recipes);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user?.emailVerifiedAt) {
    return NextResponse.json({ error: "Non autorizzata." }, { status: 401 });
  }

  await connectMongo();

  const body = await request.json();
  const medicationName = String(body.medicationName ?? "").trim();
  const memberName = String(body.memberName ?? "").trim();

  if (!medicationName || !memberName) {
    return NextResponse.json(
      { error: "memberName and medicationName are required" },
      { status: 400 }
    );
  }

  const recipe = await Recipe.create({
    familyId: user.familyId,
    memberName,
    medicationName,
    recipeCode: body.recipeCode ? String(body.recipeCode).trim() : undefined,
    doctor: body.doctor ? String(body.doctor).trim() : undefined,
    renewalDate: body.renewalDate || undefined,
    status: body.status ?? "active",
    notes: body.notes ? String(body.notes).trim() : undefined,
  });

  return NextResponse.json(recipe, { status: 201 });
}
