import mongoose, { Schema, models } from "mongoose";

const FamilyInviteSchema = new Schema(
  {
    familyId: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    name: { type: String },
    role: {
      type: String,
      enum: ["member", "viewer"],
      default: "member",
    },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    acceptedAt: { type: Date },
    invitedBy: { type: String, required: true },
  },
  { timestamps: true }
);

FamilyInviteSchema.index({ tokenHash: 1 }, { unique: true });
FamilyInviteSchema.index({ familyId: 1, acceptedAt: 1, createdAt: -1 });
FamilyInviteSchema.index({ email: 1, expiresAt: 1, acceptedAt: 1 });

export const FamilyInvite =
  models.FamilyInvite || mongoose.model("FamilyInvite", FamilyInviteSchema);
