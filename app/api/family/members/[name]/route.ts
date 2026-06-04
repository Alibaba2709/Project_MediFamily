import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getCurrentUser } from "@/app/lib/auth";
import { connectMongo } from "@/app/lib/mongodb";
import { addanteMembers, getFamilyMembers } from "@/app/lib/family";
import { canManageFamily, forbidden } from "@/app/lib/permissions";

const MAX_IMAGE_BYTES = 1024 * 1024;
const imageDataUrlPattern = /^data:image\/(jpeg|jpg|png|webp);base64,/;

type RouteContext = {
  params: Promise<{
    name: string;
  }>;
};

function serializeMember(member: {
  name: string;
  role: string;
  imageDataUrl?: string;
}) {
  return {
    name: member.name,
    role: member.role,
    ...(member.imageDataUrl ? { imageDataUrl: member.imageDataUrl } : {}),
  };
}

function validateImageDataUrl(value: unknown) {
  if (value === null) return null;
  if (typeof value !== "string" || !imageDataUrlPattern.test(value)) {
    return { error: "Formato foto non valido." };
  }

  const base64 = value.replace(imageDataUrlPattern, "");
  const size = Buffer.byteLength(base64, "base64");

  if (size > MAX_IMAGE_BYTES) {
    return { error: "La foto deve pesare al massimo 1MB." };
  }

  return { imageDataUrl: value };
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user?.emailVerifiedAt) {
    return NextResponse.json({ error: "Non autorizzata." }, { status: 401 });
  }

  await connectMongo();

  const { name } = await context.params;
  const decodedName = decodeURIComponent(name);
  const canEditMember =
    canManageFamily(user) ||
    decodedName.toLowerCase() === user.name.toLowerCase();

  if (!canEditMember) return forbidden();

  const body = await request.json();
  const validation = validateImageDataUrl(body.imageDataUrl);

  if (validation && "error" in validation) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const currentMembers = await getFamilyMembers(user);
  const memberExists = currentMembers.some(
    (member) => member.name.toLowerCase() === decodedName.toLowerCase()
  );

  if (!memberExists) {
    return NextResponse.json(
      { error: "Membro famiglia non trovato." },
      { status: 404 }
    );
  }

  const nextMembers = currentMembers.map((member) => {
    if (member.name.toLowerCase() !== decodedName.toLowerCase()) {
      return serializeMember(member);
    }

    return serializeMember({
      ...member,
      imageDataUrl: validation?.imageDataUrl,
    });
  });

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
    .map(serializeMember);

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
