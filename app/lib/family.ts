import mongoose from "mongoose";
import { connectMongo } from "@/app/lib/mongodb";
import { CurrentUser } from "@/app/lib/auth";

export type FamilyMember = {
  name: string;
  role: string;
  tone: string;
};

const tones = ["bg-[#f9d8d6]", "bg-[#d9eadf]", "bg-[#dbe7fb]", "bg-[#f7e2bf]"];

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
};

export async function getFamilyMembers(user: CurrentUser): Promise<FamilyMember[]> {
  if (user.familyId === "famiglia-addante") return addanteMembers;

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

  return [{ name: user.name, role: "Utente principale", tone: tones[0] }];
}

export function memberSlug(name: string) {
  return name.toLowerCase().replaceAll(" ", "-");
}
