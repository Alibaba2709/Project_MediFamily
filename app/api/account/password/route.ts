import { NextResponse } from "next/server";
import {
  getCurrentUser,
  hashPassword,
  validatePassword,
  verifyPassword,
} from "@/app/lib/auth";
import { connectMongo } from "@/app/lib/mongodb";
import { User } from "@/app/models/User";

type UserWithPassword = {
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
  const password = String(body.password ?? "");
  const passwordConfirm = String(body.passwordConfirm ?? "");
  const passwordErrors = validatePassword(password);

  if (!currentPassword || !password || !passwordConfirm) {
    return NextResponse.json(
      { error: "Password attuale, nuova password e conferma sono obbligatorie." },
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

  const user = await User.findById(currentUser.id).lean<UserWithPassword>();

  if (!user || !verifyPassword(currentPassword, user.passwordHash)) {
    return NextResponse.json(
      { error: "Password attuale non corretta." },
      { status: 401 }
    );
  }

  await User.updateOne(
    { _id: currentUser.id },
    {
      $set: { passwordHash: hashPassword(password) },
      $unset: {
        passwordResetTokenHash: "",
        passwordResetExpiresAt: "",
      },
    }
  );

  return NextResponse.json({
    message: "Password aggiornata.",
  });
}
