import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getCurrentUser } from "@/app/lib/auth";
import { connectMongo } from "@/app/lib/mongodb";
import { addanteMembers, getFamilyMembers } from "@/app/lib/family";
import { canManageFamily, forbidden } from "@/app/lib/permissions";

const FREE_MEMBER_LIMIT = 6;

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user?.emailVerifiedAt) {
    return NextResponse.json({ error: "Non autorizzata." }, { status: 401 });
  }

  if (!canManageFamily(user)) return forbidden();

  await connectMongo();

  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const role = String(body.role ?? "Familiare").trim();
  const currentMembers = await getFamilyMembers(user);

  if (!name) {
    return NextResponse.json(
      { error: "Il nome del familiare e obbligatorio." },
      { status: 400 }
    );
  }

  if (currentMembers.length >= FREE_MEMBER_LIMIT) {
    return NextResponse.json(
      {
        error:
          "Il piano gratuito supporta fino a 6 membri. Per aggiungerne altri servira un abbonamento.",
        upgradeRequired: true,
      },
      { status: 402 }
    );
  }

  if (
    currentMembers.some(
      (member) => member.name.toLowerCase() === name.toLowerCase()
    )
  ) {
    return NextResponse.json(
      { error: "Questo membro esiste gia nel nucleo." },
      { status: 409 }
    );
  }

  const baseMembers =
    user.familyId === "famiglia-addante"
      ? addanteMembers.map((member) => ({
          name: member.name,
          role: member.role,
          ...(member.imageDataUrl ? { imageDataUrl: member.imageDataUrl } : {}),
        }))
      : currentMembers.map((member) => ({
          name: member.name,
          role: member.role,
          ...(member.imageDataUrl ? { imageDataUrl: member.imageDataUrl } : {}),
        }));

  const nextMembers = [...baseMembers, { name, role }];

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

  return NextResponse.json({ members: nextMembers }, { status: 201 });
}
