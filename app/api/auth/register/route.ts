import { NextResponse } from "next/server";
import { connectMongo } from "@/app/lib/mongodb";
import {
  buildAppUrl,
  createRawToken,
  createSession,
  hashPassword,
  hashToken,
  normalizeEmail,
  validatePassword,
} from "@/app/lib/auth";
import mongoose from "mongoose";
import { User } from "@/app/models/User";

const defaultMembers = [
  { name: "Rossana Addante", role: "Utente principale" },
  { name: "Modesta Rugo", role: "Mamma" },
  { name: "Francesco Tritto", role: "Compagno di mamma" },
  { name: "Isabella Addante", role: "Sorella" },
];

export async function POST(request: Request) {
  try {
    await connectMongo();

    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const familyName = String(body.familyName ?? "").trim();
    const email = normalizeEmail(String(body.email ?? ""));
    const password = String(body.password ?? "");
    const passwordConfirm = String(body.passwordConfirm ?? "");
    const passwordErrors = validatePassword(password);

    if (!name || !familyName || !email || !password) {
      return NextResponse.json(
        { error: "Nome, nome famiglia, email e password sono obbligatori." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email non valida." }, { status: 400 });
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

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        { error: "Esiste gia un account con questa email." },
        { status: 409 }
      );
    }

    const addanteOwner = await User.exists({ familyId: "famiglia-addante" });
    const familyId = addanteOwner
      ? `family-${createRawToken().slice(0, 12)}`
      : "famiglia-addante";

    await mongoose.connection.collection("families").updateOne(
      { key: familyId },
      {
        $setOnInsert: {
          key: familyId,
          name: familyName,
          members: addanteOwner
            ? [{ name, role: "Utente principale" }]
            : defaultMembers,
          createdAt: new Date(),
        },
        $set: { updatedAt: new Date() },
      },
      { upsert: true }
    );

    const verificationToken = createRawToken();
    const user = await User.create({
      name,
      email,
      passwordHash: hashPassword(password),
      familyId,
      role: "owner",
      emailVerificationTokenHash: hashToken(verificationToken),
      emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await createSession(user._id.toString());

    return NextResponse.json(
      {
        message:
          "Account creato. Verifica la tua email per entrare nella dashboard.",
        verificationLink: buildAppUrl(
          `/verify-email?token=${verificationToken}`,
          request
        ),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error", error);

    return NextResponse.json(
      { error: "Errore del server durante la registrazione." },
      { status: 500 }
    );
  }
}
