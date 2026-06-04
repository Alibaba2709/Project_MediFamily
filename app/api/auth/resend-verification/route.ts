import { NextResponse } from "next/server";
import { connectMongo } from "@/app/lib/mongodb";
import {
  buildAppUrl,
  createRawToken,
  getCurrentUser,
  hashToken,
} from "@/app/lib/auth";
import { User } from "@/app/models/User";

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Non autenticata." }, { status: 401 });
  }

  await connectMongo();

  const token = createRawToken();
  await User.updateOne(
    { _id: currentUser.id },
    {
      emailVerificationTokenHash: hashToken(token),
      emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    }
  );

  return NextResponse.json({
    verificationLink: buildAppUrl(`/verify-email?token=${token}`, request),
  });
}
