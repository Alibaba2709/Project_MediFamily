import { NextResponse } from "next/server";
import { connectMongo } from "@/app/lib/mongodb";
import { hashPassword, hashToken, validatePassword } from "@/app/lib/auth";
import { User } from "@/app/models/User";

export async function POST(request: Request) {
  await connectMongo();

  const body = await request.json();
  const token = String(body.token ?? "");
  const password = String(body.password ?? "");
  const passwordConfirm = String(body.passwordConfirm ?? "");
  const passwordErrors = validatePassword(password);

  if (!token) {
    return NextResponse.json({ error: "Token mancante." }, { status: 400 });
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

  const user = await User.findOne({
    passwordResetTokenHash: hashToken(token),
    passwordResetExpiresAt: { $gt: new Date() },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Link scaduto o non valido." },
      { status: 400 }
    );
  }

  user.passwordHash = hashPassword(password);
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpiresAt = undefined;
  user.sessions = [];
  await user.save();

  return NextResponse.json({
    message: "Password aggiornata. Ora puoi accedere.",
  });
}
