import { NextResponse } from "next/server";
import { connectMongo } from "@/app/lib/mongodb";
import { getCurrentUser } from "@/app/lib/auth";
import { canEditHealth, forbidden } from "@/app/lib/permissions";
import { Visit } from "@/app/models/Visit";

export async function GET() {
  const user = await getCurrentUser();

  if (!user?.emailVerifiedAt) {
    return NextResponse.json({ error: "Non autorizzata." }, { status: 401 });
  }

  if (!canEditHealth(user)) return forbidden();

  await connectMongo();

  const visits = await Visit.find({ familyId: user.familyId }).sort({
    visitDate: 1,
  });

  return NextResponse.json(visits);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user?.emailVerifiedAt) {
    return NextResponse.json({ error: "Non autorizzata." }, { status: 401 });
  }

  await connectMongo();

  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const memberName = String(body.memberName ?? "").trim();

  if (!title || !memberName || !body.visitDate) {
    return NextResponse.json(
      { error: "memberName, title and visitDate are required" },
      { status: 400 }
    );
  }

  const visit = await Visit.create({
    familyId: user.familyId,
    memberName,
    title,
    doctor: body.doctor ? String(body.doctor).trim() : undefined,
    location: body.location ? String(body.location).trim() : undefined,
    visitDate: body.visitDate,
    visitTime: body.visitTime ? String(body.visitTime).trim() : undefined,
    paymentDueDate: body.paymentDueDate || undefined,
    cancellationDueDate: body.cancellationDueDate || undefined,
    price: body.price || body.price === 0 ? Number(body.price) : undefined,
    notes: body.notes ? String(body.notes).trim() : undefined,
    status: body.status ?? "booked",
  });

  return NextResponse.json(visit, { status: 201 });
}
