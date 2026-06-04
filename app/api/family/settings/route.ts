import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getCurrentUser } from "@/app/lib/auth";
import { connectMongo } from "@/app/lib/mongodb";

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;

    return url.toString();
  } catch {
    return null;
  }
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();

  if (!user?.emailVerifiedAt) {
    return NextResponse.json({ error: "Non autorizzata." }, { status: 401 });
  }

  const body = await request.json();
  const bookingRegion = String(body.bookingRegion ?? "").trim();
  const bookingPortalName =
    String(body.bookingPortalName ?? "").trim() || "Portale prenotazioni";
  const bookingPortalUrl = normalizeUrl(String(body.bookingPortalUrl ?? ""));

  if (bookingPortalUrl === null) {
    return NextResponse.json(
      { error: "Inserisci un link valido, ad esempio https://..." },
      { status: 400 }
    );
  }

  await connectMongo();

  await mongoose.connection.collection("families").updateOne(
    { key: user.familyId },
    {
      $setOnInsert: {
        key: user.familyId,
        name: "Nucleo familiare",
        createdAt: new Date(),
      },
      $set: {
        bookingRegion,
        bookingPortalName,
        bookingPortalUrl,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );

  return NextResponse.json({
    bookingRegion,
    bookingPortalName,
    bookingPortalUrl,
  });
}
