import { NextResponse } from "next/server";
import mongoose from "mongoose";
import {
  createSession,
  hashPassword,
  hashToken,
  validatePassword,
} from "@/app/lib/auth";
import { connectMongo } from "@/app/lib/mongodb";
import { createFamilyMemberBackup } from "@/app/lib/familyMemberBackups";
import { FamilyInvite } from "@/app/models/FamilyInvite";
import { User } from "@/app/models/User";

export async function POST(request: Request) {
  const body = await request.json();
  const token = String(body.token ?? "");
  const name = String(body.name ?? "").trim();
  const password = String(body.password ?? "");
  const passwordConfirm = String(body.passwordConfirm ?? "");
  const passwordErrors = validatePassword(password);

  if (!token || !name || !password) {
    return NextResponse.json(
      { error: "Nome e password sono obbligatori." },
      { status: 400 }
    );
  }

  if (password !== passwordConfirm) {
    return NextResponse.json(
      { error: "Le due password non coincidono." },
      { status: 400 }
    );
  }

  if (passwordErrors.length > 0) {
    return NextResponse.json(
      { error: `La password deve contenere ${passwordErrors.join(", ")}.` },
      { status: 400 }
    );
  }

  await connectMongo();

  const invite = await FamilyInvite.findOne({
    tokenHash: hashToken(token),
    expiresAt: { $gt: new Date() },
    acceptedAt: { $exists: false },
  });

  if (!invite) {
    return NextResponse.json(
      { error: "Invito non valido o scaduto." },
      { status: 404 }
    );
  }

  const existingUser = await User.findOne({ email: invite.email });
  let acceptedUserId = "";

  if (existingUser) {
    existingUser.name = name;
    existingUser.familyId = invite.familyId;
    existingUser.role = invite.role;
    existingUser.emailVerifiedAt = existingUser.emailVerifiedAt ?? new Date();
    existingUser.passwordHash = hashPassword(password);
    await existingUser.save();
    acceptedUserId = existingUser._id.toString();
    await createSession(acceptedUserId);
  } else {
    const user = await User.create({
      name,
      email: invite.email,
      passwordHash: hashPassword(password),
      familyId: invite.familyId,
      role: invite.role,
      emailVerifiedAt: new Date(),
    });
    acceptedUserId = user._id.toString();
    await createSession(acceptedUserId);
  }

  const currentMembers = await mongoose.connection
    .collection("families")
    .findOne<{ members?: Array<{ name?: string; role?: string }> }>({
      key: invite.familyId,
    });
  const members = currentMembers?.members ?? [];
  const alreadyListed = members.some(
    (member) => String(member.name ?? "").toLowerCase() === name.toLowerCase()
  );

  if (!alreadyListed) {
    const familiesCollection = mongoose.connection.collection("families");

    await createFamilyMemberBackup({
      familyId: invite.familyId,
      members,
      reason: "invite-accept",
      targetMemberName: name,
      userId: acceptedUserId,
      userName: name,
    });

    await familiesCollection.updateOne(
      { key: invite.familyId },
      {
        $push: {
          members: {
            name,
            role: invite.role === "viewer" ? "Sola lettura" : "Collaboratore",
          },
        },
        $set: { updatedAt: new Date() },
      } as Record<string, unknown>
    );
  }

  invite.acceptedAt = new Date();
  await invite.save();

  return NextResponse.json({ redirectTo: "/" });
}
