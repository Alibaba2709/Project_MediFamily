import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connectMongo } from "@/app/lib/mongodb";
import { User } from "@/app/models/User";

const SESSION_COOKIE = "medifamily_session";
const SESSION_DAYS = 30;

type UserDocument = {
  _id: { toString: () => string };
  name: string;
  email: string;
  familyId: string;
  role: "owner" | "member" | "viewer";
  emailVerifiedAt?: Date;
};

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  familyId: string;
  role: "owner" | "member" | "viewer";
  emailVerifiedAt?: string;
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function validatePassword(password: string) {
  const errors = [];

  if (password.length < 8) errors.push("almeno 8 caratteri");
  if (!/[A-Z]/.test(password)) errors.push("una lettera maiuscola");
  if (!/[a-z]/.test(password)) errors.push("una lettera minuscola");
  if (!/[0-9]/.test(password)) errors.push("un numero");

  return errors;
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");

  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;

  const expected = Buffer.from(hash, "hex");
  const actual = crypto.scryptSync(password, salt, 64);

  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

export function createRawToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function buildAppUrl(path: string, request?: Request) {
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    (request ? new URL(request.url).origin : "http://localhost:3000");

  return new URL(path, origin).toString();
}

export async function createSession(userId: string) {
  const token = createRawToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await User.updateOne(
    { _id: userId },
    { $pull: { sessions: { expiresAt: { $lte: new Date() } } } }
  );

  await User.updateOne(
    { _id: userId },
    {
      $push: { sessions: { tokenHash: hashToken(token), expiresAt } },
    }
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await connectMongo();
    await User.updateOne(
      { "sessions.tokenHash": hashToken(token) },
      { $pull: { sessions: { tokenHash: hashToken(token) } } }
    );
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  await connectMongo();

  const user = await User.findOne({
    "sessions.tokenHash": hashToken(token),
    "sessions.expiresAt": { $gt: new Date() },
  }).lean<UserDocument>();

  if (!user) return null;

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    familyId: user.familyId,
    role: user.role,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString(),
  };
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) redirect("/auth/login");

  return user;
}

export async function requireVerifiedUser() {
  const user = await requireUser();

  if (!user.emailVerifiedAt) redirect("/verify-email/sent");

  return user;
}

export async function verifyEmailToken(token: string) {
  await connectMongo();

  const user = await User.findOne({
    emailVerificationTokenHash: hashToken(token),
    emailVerificationExpiresAt: { $gt: new Date() },
  });

  if (!user) return false;

  user.emailVerifiedAt = new Date();
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpiresAt = undefined;
  await user.save();

  return true;
}
