import mongoose from "mongoose";
import sharp from "sharp";

const MAX_IMAGE_BYTES = 120 * 1024;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI. Run with: node --env-file=.env.local scripts/compress-family-avatars.mjs");
}

const imageDataUrlPattern = /^data:image\/(jpeg|jpg|png|webp);base64,/;

function imageBytes(value) {
  const base64 = value.replace(imageDataUrlPattern, "");
  return Buffer.byteLength(base64, "base64");
}

async function compressAvatar(value) {
  if (typeof value !== "string" || !imageDataUrlPattern.test(value)) return value;
  if (imageBytes(value) <= MAX_IMAGE_BYTES) return value;

  const input = Buffer.from(value.replace(imageDataUrlPattern, ""), "base64");
  const attempts = [
    { size: 360, quality: 78 },
    { size: 288, quality: 72 },
    { size: 220, quality: 68 },
    { size: 180, quality: 62 },
  ];

  let smallest = null;

  for (const attempt of attempts) {
    const output = await sharp(input)
      .rotate()
      .resize({
        width: attempt.size,
        height: attempt.size,
        fit: "cover",
        position: "attention",
      })
      .jpeg({ quality: attempt.quality, mozjpeg: true })
      .toBuffer();

    if (!smallest || output.length < smallest.length) smallest = output;
    if (output.length <= MAX_IMAGE_BYTES) {
      return `data:image/jpeg;base64,${output.toString("base64")}`;
    }
  }

  return smallest
    ? `data:image/jpeg;base64,${smallest.toString("base64")}`
    : value;
}

await mongoose.connect(MONGODB_URI, { dbName: "medifamily" });

const families = mongoose.connection.collection("families");
const cursor = families.find(
  { "members.imageDataUrl": { $exists: true } },
  { projection: { key: 1, members: 1 } }
);

let familiesChecked = 0;
let familiesUpdated = 0;
let avatarsCompressed = 0;
let bytesBefore = 0;
let bytesAfter = 0;

for await (const family of cursor) {
  familiesChecked += 1;
  let changed = false;
  const members = [];

  for (const member of family.members ?? []) {
    const currentImage = member.imageDataUrl;

    if (typeof currentImage === "string" && imageDataUrlPattern.test(currentImage)) {
      const before = imageBytes(currentImage);
      const nextImage = await compressAvatar(currentImage);
      const after = imageBytes(nextImage);

      bytesBefore += before;
      bytesAfter += after;

      if (nextImage !== currentImage) {
        changed = true;
        avatarsCompressed += 1;
        members.push({ ...member, imageDataUrl: nextImage });
        continue;
      }
    }

    members.push(member);
  }

  if (changed) {
    await families.updateOne(
      { _id: family._id },
      { $set: { members, updatedAt: new Date() } }
    );
    familiesUpdated += 1;
  }
}

await mongoose.disconnect();

console.log(
  JSON.stringify(
    {
      familiesChecked,
      familiesUpdated,
      avatarsCompressed,
      bytesBefore,
      bytesAfter,
      savedBytes: bytesBefore - bytesAfter,
    },
    null,
    2
  )
);
