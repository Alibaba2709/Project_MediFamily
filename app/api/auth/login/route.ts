import { NextResponse } from "next/server";
import { connectMongo } from "@/app/lib/mongodb";
import { createSession, normalizeEmail, verifyPassword } from "@/app/lib/auth";
import { User } from "@/app/models/User";

type LoginUser = {
  _id: { toString: () => string };
  passwordHash: string;
  emailVerifiedAt?: Date;
};

export async function POST(request: Request) {
  await connectMongo();

  const body = await request.json();
  const email = normalizeEmail(String(body.email ?? ""));
  const password = String(body.password ?? "");

  const user = await User.findOne({ email }).lean<LoginUser>();

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json(
      { error: "Email o password non corrette." },
      { status: 401 }
    );
  }

  await createSession(user._id.toString());

  return NextResponse.json({
    redirectTo: user.emailVerifiedAt ? "/" : "/verify-email/sent",
  });
}
