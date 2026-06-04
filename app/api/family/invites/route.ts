import { NextResponse } from "next/server";
import mongoose from "mongoose";
import {
  buildAppUrl,
  createRawToken,
  getCurrentUser,
  hashToken,
  normalizeEmail,
} from "@/app/lib/auth";
import { inviteEmail, sendEmail } from "@/app/lib/email";
import { canManageFamily, forbidden } from "@/app/lib/permissions";
import { connectMongo } from "@/app/lib/mongodb";
import { FamilyInvite } from "@/app/models/FamilyInvite";
import { User } from "@/app/models/User";

const allowedRoles = ["member", "viewer"];

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user?.emailVerifiedAt) {
    return NextResponse.json({ error: "Non autorizzata." }, { status: 401 });
  }

  if (!canManageFamily(user)) return forbidden();

  await connectMongo();

  const body = await request.json();
  const email = normalizeEmail(String(body.email ?? ""));
  const name = String(body.name ?? "").trim();
  const role = String(body.role ?? "member");

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email non valida." }, { status: 400 });
  }

  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ error: "Ruolo non valido." }, { status: 400 });
  }

  const existingFamilyUser = await User.findOne({
    email,
    familyId: user.familyId,
  });

  if (existingFamilyUser) {
    return NextResponse.json(
      { error: "Questo utente fa gia parte del nucleo." },
      { status: 409 }
    );
  }

  const token = createRawToken();
  const family = await mongoose.connection
    .collection("families")
    .findOne<{ name?: string }>({ key: user.familyId });

  await FamilyInvite.create({
    familyId: user.familyId,
    email,
    name,
    role,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    invitedBy: user.id,
  });

  const inviteLink = buildAppUrl(`/invite/${token}`, request);
  const emailResult = await sendEmail({
    to: email,
    ...inviteEmail({
      familyName: family?.name ?? "Nucleo familiare",
      inviterName: user.name,
      link: inviteLink,
    }),
  });

  if (!emailResult.ok) {
    await FamilyInvite.deleteOne({ tokenHash: hashToken(token) });
    return NextResponse.json({ error: emailResult.error }, { status: 500 });
  }

  return NextResponse.json({ message: "Invito inviato." }, { status: 201 });
}
