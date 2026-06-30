import mongoose from "mongoose";
import { connectMongo } from "@/app/lib/mongodb";
import { CurrentUser } from "@/app/lib/auth";
import {
  buildFamilyPlanSummary,
  type FamilyPlanSummary,
} from "@/app/lib/plans";

export type FamilyMember = {
  name: string;
  role: string;
  tone: string;
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

export type FamilyBookingSettings = {
  region: string;
  portalName: string;
  portalUrl: string;
};

export type FamilyNotificationSettings = {
  emailEnabled: boolean;
  visitDaysBefore: number;
  recipeDaysBefore: number;
  paymentEnabled: boolean;
  cancellationEnabled: boolean;
  recipeEnabled: boolean;
  documentEnabled: boolean;
};

const tones = ["bg-[#f9d8d6]", "bg-[#d9eadf]", "bg-[#dbe7fb]", "bg-[#f7e2bf]"];
const pugliaBookingSettings: FamilyBookingSettings = {
  region: "Puglia",
  portalName: "Puglia Salute",
  portalUrl: "https://www.sanita.puglia.it/web/guest/servizi-di-prenotazione",
};

export const addanteMembers: FamilyMember[] = [
  { name: "Rossana Addante", role: "Utente principale", tone: tones[0] },
  { name: "Modesta Rugo", role: "Mamma", tone: tones[1] },
  { name: "Francesco Tritto", role: "Compagno di mamma", tone: tones[2] },
  { name: "Isabella Addante", role: "Sorella", tone: tones[3] },
];

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
  bookingRegion?: string;
  bookingPortalName?: string;
  bookingPortalUrl?: string;
  notificationSettings?: Partial<FamilyNotificationSettings>;
  plan?: string;
  subscriptionStatus?: string;
};

function mapFamilyMembers(
  family: StoredFamily | null,
  user: CurrentUser
): FamilyMember[] {
  const storedMembers = family?.members ?? [];
  const members = storedMembers
    .map((member, index) => ({
      name: String(member.name ?? "").trim(),
      role: String(member.role ?? "Familiare").trim(),
      tone: tones[index % tones.length],
      imageDataUrl: String(member.imageDataUrl ?? "").trim() || undefined,
      birthDate: String(member.birthDate ?? "").trim() || undefined,
      fiscalCode: String(member.fiscalCode ?? "").trim() || undefined,
      bloodType: String(member.bloodType ?? "").trim() || undefined,
      primaryDoctor: String(member.primaryDoctor ?? "").trim() || undefined,
      emergencyContactName:
        String(member.emergencyContactName ?? "").trim() || undefined,
      emergencyContactPhone:
        String(member.emergencyContactPhone ?? "").trim() || undefined,
      allergies: String(member.allergies ?? "").trim() || undefined,
      conditions: String(member.conditions ?? "").trim() || undefined,
      healthNotes: String(member.healthNotes ?? "").trim() || undefined,
    }))
    .filter((member) => member.name);

  if (members.length > 0) return members;

  if (user.familyId === "famiglia-addante") return addanteMembers;

  return [{ name: user.name, role: "Utente principale", tone: tones[0] }];
}

function mapFamilyBookingSettings(
  family: StoredFamily | null,
  user: CurrentUser
): FamilyBookingSettings {
  const storedSettings = {
    region: String(family?.bookingRegion ?? "").trim(),
    portalName: String(family?.bookingPortalName ?? "").trim(),
    portalUrl: String(family?.bookingPortalUrl ?? "").trim(),
  };

  if (
    storedSettings.region ||
    storedSettings.portalName ||
    storedSettings.portalUrl
  ) {
    return {
      region: storedSettings.region,
      portalName: storedSettings.portalName || "Portale prenotazioni",
      portalUrl: storedSettings.portalUrl,
    };
  }

  if (user.familyId === "famiglia-addante") return pugliaBookingSettings;

  return {
    region: "",
    portalName: "Portale prenotazioni",
    portalUrl: "",
  };
}

async function getStoredFamily(user: CurrentUser) {
  await connectMongo();

  return mongoose.connection
    .collection("families")
    .findOne<StoredFamily>({ key: user.familyId });
}

export async function getFamilyMembers(user: CurrentUser): Promise<FamilyMember[]> {
  const family = await getStoredFamily(user);

  return mapFamilyMembers(family, user);
}

export async function getFamilyProfile(user: CurrentUser) {
  const family = await getStoredFamily(user);

  return {
    members: mapFamilyMembers(family, user),
    bookingSettings: mapFamilyBookingSettings(family, user),
    plan: buildFamilyPlanSummary(family?.plan, family?.subscriptionStatus),
  };
}

export async function getFamilyPlan(
  user: CurrentUser
): Promise<FamilyPlanSummary> {
  const family = await getStoredFamily(user);

  return buildFamilyPlanSummary(family?.plan, family?.subscriptionStatus);
}

export function memberSlug(name: string) {
  return name.toLowerCase().replaceAll(" ", "-");
}

export function getPrimaryFamilyMemberName(
  members: FamilyMember[],
  fallback = "Utente principale"
) {
  return (
    members.find(
      (member) => member.role.trim().toLowerCase() === "utente principale"
    )?.name ??
    members[0]?.name ??
    fallback
  );
}

export function displayFamilyMemberName(
  memberName: string,
  members: FamilyMember[]
) {
  const name = memberName.trim();

  if (name.toLowerCase() === "utente principale") {
    return getPrimaryFamilyMemberName(members, name);
  }

  return name;
}

export function normalizeFamilyMemberNames(
  names: string[],
  members: FamilyMember[]
) {
  return Array.from(
    new Set(names.map((name) => displayFamilyMemberName(name, members)))
  ).filter(Boolean);
}

export async function getFamilyBookingSettings(
  user: CurrentUser
): Promise<FamilyBookingSettings> {
  const family = await getStoredFamily(user);

  return mapFamilyBookingSettings(family, user);
}

export async function getFamilyNotificationSettings(
  user: CurrentUser
): Promise<FamilyNotificationSettings> {
  await connectMongo();

  const family = await mongoose.connection
    .collection("families")
    .findOne<StoredFamily>({ key: user.familyId });
  const settings = family?.notificationSettings ?? {};

  return {
    emailEnabled: settings.emailEnabled ?? true,
    visitDaysBefore: settings.visitDaysBefore ?? 1,
    recipeDaysBefore: settings.recipeDaysBefore ?? 7,
    paymentEnabled: settings.paymentEnabled ?? true,
    cancellationEnabled: settings.cancellationEnabled ?? true,
    recipeEnabled: settings.recipeEnabled ?? true,
    documentEnabled: settings.documentEnabled ?? true,
  };
}
