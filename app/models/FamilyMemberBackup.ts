import mongoose, { Schema, models } from "mongoose";

const FamilyMemberBackupMemberSchema = new Schema(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
    imageDataUrl: { type: String },
    birthDate: { type: String },
    fiscalCode: { type: String },
    bloodType: { type: String },
    primaryDoctor: { type: String },
    emergencyContactName: { type: String },
    emergencyContactPhone: { type: String },
    allergies: { type: String },
    conditions: { type: String },
    healthNotes: { type: String },
  },
  { _id: false }
);

const FamilyMemberBackupSchema = new Schema(
  {
    familyId: { type: String, required: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    reason: {
      type: String,
      enum: ["add", "update", "delete", "invite-accept", "restore"],
      required: true,
    },
    targetMemberName: { type: String },
    memberCount: { type: Number, required: true },
    members: { type: [FamilyMemberBackupMemberSchema], required: true },
  },
  { timestamps: true }
);

FamilyMemberBackupSchema.index({ familyId: 1, createdAt: -1 });

export const FamilyMemberBackup =
  models.FamilyMemberBackup ||
  mongoose.model("FamilyMemberBackup", FamilyMemberBackupSchema);
