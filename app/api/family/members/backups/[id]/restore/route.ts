import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getCurrentUser } from "@/app/lib/auth";
import { connectMongo } from "@/app/lib/mongodb";
import { canManageFamily, forbidden } from "@/app/lib/permissions";
import { createFamilyMemberBackup } from "@/app/lib/familyMemberBackups";
import { FamilyMemberBackup } from "@/app/models/FamilyMemberBackup";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type StoredFamily = {
  members?: Array<{
    name?: string;
    role?: string;
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
  }>;
};

type StoredBackup = {
  familyId: string;
  members: StoredFamily["members"];
};

export async function POST(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user?.emailVerifiedAt) {
    return NextResponse.json({ error: "Non autorizzata." }, { status: 401 });
  }

  if (!canManageFamily(user)) return forbidden();

  const { id } = await context.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Backup non valido." }, { status: 400 });
  }

  await connectMongo();

  const backup = await FamilyMemberBackup.findOne({
    _id: id,
    familyId: user.familyId,
  }).lean<StoredBackup | null>();

  if (!backup || !Array.isArray(backup.members) || backup.members.length === 0) {
    return NextResponse.json(
      { error: "Backup non trovato o vuoto." },
      { status: 404 }
    );
  }

  const families = mongoose.connection.collection<StoredFamily>("families");
  const currentFamily = await families.findOne({ key: user.familyId });
  const currentMembers = currentFamily?.members ?? [];

  await createFamilyMemberBackup({
    familyId: user.familyId,
    members: currentMembers,
    reason: "restore",
    targetMemberName: "Ripristino backup",
    userId: user.id,
    userName: user.name,
  });

  await families.updateOne(
    { key: user.familyId },
    {
      $set: {
        members: backup.members,
        updatedAt: new Date(),
      },
    }
  );

  return NextResponse.json({
    members: backup.members,
    restoredCount: backup.members.length,
  });
}
