import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getCurrentUser } from "@/app/lib/auth";
import { connectMongo } from "@/app/lib/mongodb";
import { canManageFamily, forbidden } from "@/app/lib/permissions";
import { User } from "@/app/models/User";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const allowedRoles = ["member", "viewer"];

export async function PATCH(request: Request, context: RouteContext) {
  const currentUser = await getCurrentUser();

  if (!currentUser?.emailVerifiedAt) {
    return NextResponse.json({ error: "Non autorizzata." }, { status: 401 });
  }

  if (!canManageFamily(currentUser)) return forbidden();

  const { id } = await context.params;
  const body = await request.json();
  const role = String(body.role ?? "");

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Utente non valido." }, { status: 400 });
  }

  if (id === currentUser.id) {
    return NextResponse.json(
      { error: "Non puoi cambiare il tuo ruolo proprietario." },
      { status: 400 }
    );
  }

  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ error: "Ruolo non valido." }, { status: 400 });
  }

  await connectMongo();

  const user = await User.findOneAndUpdate(
    { _id: id, familyId: currentUser.familyId },
    { role },
    { new: true }
  );

  if (!user) {
    return NextResponse.json({ error: "Utente non trovato." }, { status: 404 });
  }

  return NextResponse.json({ role: user.role });
}
