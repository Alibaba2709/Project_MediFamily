import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getCurrentUser } from "@/app/lib/auth";
import { connectMongo } from "@/app/lib/mongodb";
import { getFamilyMembers, getFamilyPlan } from "@/app/lib/family";
import { canManageFamily, forbidden } from "@/app/lib/permissions";
import { PREMIUM_MEMBER_LIMIT } from "@/app/lib/plans";

function serializeMember(member: {
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
}) {
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
  const [currentMembers, plan] = await Promise.all([
    getFamilyMembers(user),
    getFamilyPlan(user),
  ]);

  if (!name) {
    return NextResponse.json(
      { error: "Il nome del familiare e obbligatorio." },
      { status: 400 }
    );
  }

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

  const baseMembers = currentMembers.map(serializeMember);
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
