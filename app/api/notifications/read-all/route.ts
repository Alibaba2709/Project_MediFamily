import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/auth";
import { connectMongo } from "@/app/lib/mongodb";
import { NotificationState } from "@/app/models/NotificationState";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user?.emailVerifiedAt) {
    return NextResponse.json({ error: "Non autorizzata." }, { status: 401 });
  }

  const body = (await request.json()) as { notificationIds?: unknown };
  const notificationIds = Array.isArray(body.notificationIds)
    ? body.notificationIds
        .map((notificationId: unknown) => String(notificationId ?? "").trim())
        .filter(Boolean)
    : [];

  if (notificationIds.length === 0) {
    return NextResponse.json({ ok: true, updatedCount: 0 });
  }

  await connectMongo();

  const readAt = new Date();
  const uniqueNotificationIds = [...new Set(notificationIds)];

  await NotificationState.bulkWrite(
    uniqueNotificationIds.map((notificationId) => ({
      updateOne: {
        filter: { userId: user.id, notificationId },
        update: {
          $set: {
            familyId: user.familyId,
            readAt,
          },
        },
        upsert: true,
      },
    }))
  );

  return NextResponse.json({
    ok: true,
    updatedCount: uniqueNotificationIds.length,
  });
}
