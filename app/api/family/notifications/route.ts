import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getCurrentUser } from "@/app/lib/auth";
import { connectMongo } from "@/app/lib/mongodb";
import { canManageFamily, forbidden } from "@/app/lib/permissions";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();

  if (!user?.emailVerifiedAt) {
    return NextResponse.json({ error: "Non autorizzata." }, { status: 401 });
  }

  if (!canManageFamily(user)) return forbidden();

  const body = await request.json();
  const notificationSettings = {
    emailEnabled: Boolean(body.emailEnabled),
    visitDaysBefore: Math.max(0, Number(body.visitDaysBefore ?? 1)),
    recipeDaysBefore: Math.max(0, Number(body.recipeDaysBefore ?? 7)),
    paymentEnabled: Boolean(body.paymentEnabled),
    cancellationEnabled: Boolean(body.cancellationEnabled),
    recipeEnabled: Boolean(body.recipeEnabled),
    documentEnabled: Boolean(body.documentEnabled),
  };

  await connectMongo();

  await mongoose.connection.collection("families").updateOne(
    { key: user.familyId },
    {
      $setOnInsert: {
        key: user.familyId,
        name: "Nucleo familiare",
        createdAt: new Date(),
      },
      $set: {
        notificationSettings,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );

  return NextResponse.json({ notificationSettings });
}
