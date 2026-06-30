import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getCurrentUser } from "@/app/lib/auth";
import { connectMongo } from "@/app/lib/mongodb";
import { addanteMembers } from "@/app/lib/family";
import { canManageFamily, forbidden } from "@/app/lib/permissions";
import {
  buildFamilyPlanSummary,
  PREMIUM_MEMBER_LIMIT,
} from "@/app/lib/plans";

type SerializableMember = {
  name: string;
  role: string;
  imageDataUrl?: string;
  birthDate?: string;
  fiscalCode?: string;
  bloodType?: string;
  primaryDoctor?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  allergies?: string;
  conditions?: string;
  healthNotes?: string;
};

type StoredFamily = {
  members?: SerializableMember[];
  plan?: string;
  subscriptionStatus?: string;
};

function serializeMember(member: SerializableMember) {
  return {
    name: member.name,
    role: member.role,
    ...(member.imageDataUrl ? { imageDataUrl: member.imageDataUrl } : {}),
    ...(member.birthDate ? { birthDate: member.birthDate } : {}),
    ...(member.fiscalCode ? { fiscalCode: member.fiscalCode } : {}),
    ...(member.bloodType ? { bloodType: member.bloodType } : {}),
    ...(member.primaryDoctor ? { primaryDoctor: member.primaryDoctor } : {}),
    ...(member.emergencyContactName
      ? { emergencyContactName: member.emergencyContactName }
      : {}),
    ...(member.emergencyContactPhone
      ? { emergencyContactPhone: member.emergencyContactPhone }
      : {}),
    ...(member.allergies ? { allergies: member.allergies } : {}),
    ...(member.conditions ? { conditions: member.conditions } : {}),
    ...(member.healthNotes ? { healthNotes: member.healthNotes } : {}),
  };
}

function fallbackMembersForFamily(user: { familyId: string; name: string }) {
  if (user.familyId === "famiglia-addante") {
    return addanteMembers.map(serializeMember);
  }

  return [
    serializeMember({
      name: user.name,
      role: "Utente principale",
    }),
  ];
}

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

  if (!name) {
    return NextResponse.json(
      { error: "Il nome del familiare e obbligatorio." },
      { status: 400 }
    );
  }

  const families = mongoose.connection.collection<StoredFamily>("families");
  const family = await families.findOne({ key: user.familyId });
  const hasStoredMembers = Boolean(family?.members?.length);
  const currentMembers = hasStoredMembers
    ? (family?.members ?? []).map(serializeMember)
    : fallbackMembersForFamily(user);
  const plan = buildFamilyPlanSummary(
    family?.plan,
    family?.subscriptionStatus
  );

  if (currentMembers.length >= plan.memberLimit) {
    return NextResponse.json(
      {
        error: plan.isPremiumActive
          ? `Il piano Premium supporta fino a ${PREMIUM_MEMBER_LIMIT} membri.`
          : `Il piano gratuito supporta fino a ${plan.memberLimit} membri. Il Premium arriva a ${PREMIUM_MEMBER_LIMIT}.`,
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

  if (!hasStoredMembers) {
    await families.updateOne(
      { key: user.familyId },
      {
        $setOnInsert: {
          key: user.familyId,
          name: "Nucleo familiare",
          createdAt: new Date(),
        },
        $set: {
          members: currentMembers,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );
  }

  const updateResult = await families.updateOne(
    {
      key: user.familyId,
      "members.name": { $ne: name },
      $expr: { $lt: [{ $size: "$members" }, plan.memberLimit] },
    },
    {
      $push: {
        members: { name, role },
      },
      $set: {
        updatedAt: new Date(),
      },
    }
  );

  if (updateResult.modifiedCount === 0) {
    const latestFamily = await families.findOne({ key: user.familyId });
    const latestMembers = latestFamily?.members ?? [];
    const duplicateExists = latestMembers.some(
      (member) => member.name.toLowerCase() === name.toLowerCase()
    );

    if (duplicateExists) {
      return NextResponse.json(
        { error: "Questo membro esiste gia nel nucleo." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: plan.isPremiumActive
          ? `Il piano Premium supporta fino a ${PREMIUM_MEMBER_LIMIT} membri.`
          : `Il piano gratuito supporta fino a ${plan.memberLimit} membri. Il Premium arriva a ${PREMIUM_MEMBER_LIMIT}.`,
        upgradeRequired: true,
      },
      { status: 402 }
    );
  }

  const updatedFamily = await families.findOne({ key: user.familyId });

  return NextResponse.json(
    { members: updatedFamily?.members ?? [] },
    { status: 201 }
  );
}
