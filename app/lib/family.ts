import mongoose from "mongoose";
import { connectMongo } from "@/app/lib/mongodb";
import { CurrentUser } from "@/app/lib/auth";

export type FamilyMember = {
  name: string;
  role: string;
  tone: string;
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
  }>;
  bookingRegion?: string;
  bookingPortalName?: string;
  bookingPortalUrl?: string;
  notificationSettings?: Partial<FamilyNotificationSettings>;
};

export async function getFamilyMembers(user: CurrentUser): Promise<FamilyMember[]> {
  await connectMongo();

  const family = await mongoose.connection
    .collection("families")
    .findOne<StoredFamily>({ key: user.familyId });
  const storedMembers = family?.members ?? [];
  const members = storedMembers
    .map((member, index) => ({
      name: String(member.name ?? "").trim(),
      role: String(member.role ?? "Familiare").trim(),
      tone: tones[index % tones.length],
    }))
    .filter((member) => member.name);

  if (members.length > 0) return members;

  if (user.familyId === "famiglia-addante") return addanteMembers;

  return [{ name: user.name, role: "Utente principale", tone: tones[0] }];
}

export function memberSlug(name: string) {
  return name.toLowerCase().replaceAll(" ", "-");
}

export async function getFamilyBookingSettings(
  user: CurrentUser
): Promise<FamilyBookingSettings> {
  await connectMongo();

  const family = await mongoose.connection
    .collection("families")
    .findOne<StoredFamily>({ key: user.familyId });

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
