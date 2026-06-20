import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/auth";
import { connectMongo } from "@/app/lib/mongodb";
import { NotificationState } from "@/app/models/NotificationState";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user?.emailVerifiedAt) {
    return NextResponse.json({ error: "Non autorizzata." }, { status: 401 });
  }

  const body = await request.json();
  const notificationId = String(body.notificationId ?? "").trim();

  if (!notificationId) {
    return NextResponse.json(
      { error: "Notifica non valida." },
      { status: 400 }
    );
  }

  await connectMongo();

  await NotificationState.updateOne(
    { userId: user.id, notificationId },
    {
      $set: {
        familyId: user.familyId,
        readAt: new Date(),
      },
    },
    { upsert: true }
  );

  return NextResponse.json({ ok: true });
}
