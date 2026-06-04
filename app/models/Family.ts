import mongoose, { Schema, models } from "mongoose";

const FamilyMemberSchema = new Schema(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
  },
  { _id: false }
);

const FamilySchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    members: { type: [FamilyMemberSchema], default: [] },
    bookingRegion: { type: String },
    bookingPortalName: { type: String },
    bookingPortalUrl: { type: String },
  },
  { timestamps: true }
);

export const Family =
  models.Family || mongoose.model("Family", FamilySchema);
