import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getCurrentUser } from "@/app/lib/auth";
import { connectMongo } from "@/app/lib/mongodb";
import { addanteMembers, getFamilyMembers } from "@/app/lib/family";
import { canManageFamily, forbidden } from "@/app/lib/permissions";

type RouteContext = {
  params: Promise<{
    name: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user?.emailVerifiedAt) {
    return NextResponse.json({ error: "Non autorizzata." }, { status: 401 });
  }

  if (!canManageFamily(user)) return forbidden();

  await connectMongo();

  const { name } = await context.params;
  const decodedName = decodeURIComponent(name);

  if (decodedName.toLowerCase() === user.name.toLowerCase()) {
    return NextResponse.json(
      { error: "Non puoi rimuovere l'utente principale dal nucleo." },
      { status: 400 }
    );
  }

  const currentMembers = await getFamilyMembers(user);
  const baseMembers =
    user.familyId === "famiglia-addante"
      ? addanteMembers
      : currentMembers;
  const nextMembers = baseMembers
    .filter((member) => member.name !== decodedName)
    .map((member) => ({
      name: member.name,
      role: member.role,
    }));

  await mongoose.connection.collection("families").updateOne(
    { key: user.familyId },
    {
      $setOnInsert: {
        key: user.familyId,
        name: "Nucleo familiare",
        createdAt: new Date(),
      },
      $set: {
        members: nextMembers,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );

  return NextResponse.json({ members: nextMembers });
}
