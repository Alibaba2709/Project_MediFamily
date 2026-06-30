import { FamilyMemberBackup } from "@/app/models/FamilyMemberBackup";

export type BackupFamilyMember = {
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
};

export type FamilyMemberBackupReason =
  | "add"
  | "update"
  | "delete"
  | "invite-accept"
  | "restore";

export type FamilyMemberBackupView = {
  id: string;
  createdAt: string;
  memberCount: number;
  reason: FamilyMemberBackupReason;
  targetMemberName?: string;
  userName: string;
};

export function serializeBackupMember(member: BackupFamilyMember) {
  const name = String(member.name ?? "").trim();
  const role = String(member.role ?? "Familiare").trim();

  if (!name) return null;

  return {
    name,
    role,
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

export async function createFamilyMemberBackup({
  familyId,
  members,
  reason,
  targetMemberName,
  userId,
  userName,
}: {
  familyId: string;
  members: BackupFamilyMember[];
  reason: FamilyMemberBackupReason;
  targetMemberName?: string;
  userId: string;
  userName: string;
}) {
  const safeMembers = members
    .map((member) => serializeBackupMember(member))
    .filter((member): member is NonNullable<typeof member> => Boolean(member));

  if (safeMembers.length === 0) return;

  await FamilyMemberBackup.create({
    familyId,
    members: safeMembers,
    memberCount: safeMembers.length,
    reason,
    targetMemberName,
    userId,
    userName,
  });

  const staleBackups = await FamilyMemberBackup.find({ familyId })
    .sort({ createdAt: -1 })
    .skip(25)
    .select("_id")
    .lean<Array<{ _id: unknown }>>();

  if (staleBackups.length > 0) {
    await FamilyMemberBackup.deleteMany({
      _id: { $in: staleBackups.map((backup) => backup._id) },
    });
  }
}

export async function getFamilyMemberBackupViews(
  familyId: string,
  limit = 8
): Promise<FamilyMemberBackupView[]> {
  const backups = await FamilyMemberBackup.find({ familyId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean<
      Array<{
        _id: { toString: () => string };
        createdAt?: Date;
        memberCount?: number;
        reason?: FamilyMemberBackupReason;
        targetMemberName?: string;
        userName?: string;
      }>
    >();

  return backups.map((backup) => ({
    id: backup._id.toString(),
    createdAt: backup.createdAt?.toISOString() ?? new Date().toISOString(),
    memberCount: backup.memberCount ?? 0,
    reason: backup.reason ?? "update",
    targetMemberName: backup.targetMemberName,
    userName: backup.userName ?? "Account",
  }));
}
