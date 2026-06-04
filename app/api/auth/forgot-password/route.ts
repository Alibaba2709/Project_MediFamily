import { NextResponse } from "next/server";
import { connectMongo } from "@/app/lib/mongodb";
import {
  buildAppUrl,
  createRawToken,
  hashToken,
  normalizeEmail,
} from "@/app/lib/auth";
import { resetPasswordEmail, sendEmail } from "@/app/lib/email";
import { User } from "@/app/models/User";

export async function POST(request: Request) {
  await connectMongo();

  const body = await request.json();
  const email = normalizeEmail(String(body.email ?? ""));
  const user = await User.findOne({ email });
  let resetLink: string | null = null;

  if (user) {
    const token = createRawToken();
    user.passwordResetTokenHash = hashToken(token);
    user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    resetLink = buildAppUrl(`/auth/reset-password?token=${token}`, request);
    const emailResult = await sendEmail({
      to: email,
      ...resetPasswordEmail(resetLink),
    });

    if (!emailResult.ok) {
      return NextResponse.json({ error: emailResult.error }, { status: 500 });
    }
  }

  return NextResponse.json({
    message:
      "Se l'email esiste, riceverai un link per impostare una nuova password.",
  });
}
