import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectMongo } from "@/app/lib/mongodb";
import { getCurrentUser } from "@/app/lib/auth";
import { canEditHealth, forbidden } from "@/app/lib/permissions";
import { Recipe } from "@/app/models/Recipe";

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
    return NextResponse.json({ error: "Invalid recipe id" }, { status: 400 });
  }

  const body = await request.json();
  const medicationName = String(body.medicationName ?? "").trim();
  const memberName = String(body.memberName ?? "").trim();

  if (!medicationName || !memberName) {
    return NextResponse.json(
      { error: "memberName and medicationName are required" },
      { status: 400 }
    );
  }

  const recipe = await Recipe.findOneAndUpdate(
    { _id: id, familyId: user.familyId },
    {
      familyId: user.familyId,
      memberName,
      medicationName,
      recipeCode: body.recipeCode ? String(body.recipeCode).trim() : undefined,
      doctor: body.doctor ? String(body.doctor).trim() : undefined,
      renewalDate: body.renewalDate || undefined,
      status: body.status ?? "active",
      notes: body.notes ? String(body.notes).trim() : undefined,
    },
    { new: true, runValidators: true }
  );

  if (!recipe) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  return NextResponse.json(recipe);
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
    return NextResponse.json({ error: "Invalid recipe id" }, { status: 400 });
  }

  const recipe = await Recipe.findOneAndDelete({
    _id: id,
    familyId: user.familyId,
  });

  if (!recipe) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}
