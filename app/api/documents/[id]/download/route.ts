import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectMongo } from "@/app/lib/mongodb";
import { getCurrentUser } from "@/app/lib/auth";
import { HealthDocument } from "@/app/models/HealthDocument";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user?.emailVerifiedAt) {
    return NextResponse.json({ error: "Non autorizzata." }, { status: 401 });
  }

  await connectMongo();

  const { id } = await context.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid document id" }, { status: 400 });
  }

  const document = await HealthDocument.findOne({
    _id: id,
    familyId: user.familyId,
  });

  if (!document || !document.fileData) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const [metadata, data] = String(document.fileData).split(",");
  const mimeType =
    document.fileType ||
    metadata?.match(/^data:(.*);base64$/)?.[1] ||
    "application/octet-stream";
  const bytes = Buffer.from(data ?? "", "base64");
  const fileName = document.fileName || `${document.title}.bin`;

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
