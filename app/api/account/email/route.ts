import { NextResponse } from "next/server";
import {
  buildAppUrl,
  createRawToken,
  getCurrentUser,
  hashToken,
  normalizeEmail,
  verifyPassword,
} from "@/app/lib/auth";
import { connectMongo } from "@/app/lib/mongodb";
import { sendEmail, verificationEmail } from "@/app/lib/email";
import { User } from "@/app/models/User";

type UserWithPassword = {
  _id: { toString: () => string };
  email: string;
  passwordHash: string;
};

export async function PATCH(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser?.emailVerifiedAt) {
    return NextResponse.json({ error: "Non autenticata." }, { status: 401 });
  }

  await connectMongo();

  const body = await request.json();
  const currentPassword = String(body.currentPassword ?? "");
  const email = normalizeEmail(String(body.email ?? ""));
  const emailConfirm = normalizeEmail(String(body.emailConfirm ?? ""));

  if (!currentPassword || !email || !emailConfirm) {
    return NextResponse.json(
      { error: "Password attuale, nuova email e conferma email sono obbligatorie." },
      { status: 400 }
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email non valida." }, { status: 400 });
  }

  if (email !== emailConfirm) {
    return NextResponse.json(
      { error: "Le due email non coincidono." },
      { status: 400 }
    );
  }

  if (email === currentUser.email) {
    return NextResponse.json(
      { error: "Questa email e gia collegata al tuo account." },
      { status: 400 }
    );
  }

  const user = await User.findById(currentUser.id).lean<UserWithPassword>();

  if (!user || !verifyPassword(currentPassword, user.passwordHash)) {
    return NextResponse.json(
      { error: "Password attuale non corretta." },
      { status: 401 }
    );
  }

  const existingUser = await User.exists({ email });

  if (existingUser) {
    return NextResponse.json(
      { error: "Esiste gia un account con questa email." },
      { status: 409 }
    );
  }

  const token = createRawToken();
  const previousEmail = user.email;

  await User.updateOne(
    { _id: currentUser.id },
    {
      $set: {
        email,
        emailVerificationTokenHash: hashToken(token),
        emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      $unset: { emailVerifiedAt: "" },
    }
  );

  const verificationLink = buildAppUrl(`/verify-email?token=${token}`, request);
  const emailResult = await sendEmail({
    to: email,
    ...verificationEmail(verificationLink),
  });

  if (!emailResult.ok) {
    await User.updateOne(
      { _id: currentUser.id },
      {
        $set: {
          email: previousEmail,
          emailVerifiedAt: new Date(currentUser.emailVerifiedAt),
        },
        $unset: {
          emailVerificationTokenHash: "",
          emailVerificationExpiresAt: "",
        },
      }
    );

    return NextResponse.json({ error: emailResult.error }, { status: 500 });
  }

  return NextResponse.json({
    message: "Email aggiornata. Ti abbiamo inviato un link di verifica.",
    redirectTo: "/verify-email/sent",
  });
}
