import mongoose, { Schema, models } from "mongoose";

const SessionSchema = new Schema(
  {
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    familyId: { type: String, required: true },
    role: {
      type: String,
      enum: ["owner", "member", "viewer"],
      default: "owner",
    },
    emailVerifiedAt: { type: Date },
    emailVerificationTokenHash: { type: String },
    emailVerificationExpiresAt: { type: Date },
    passwordResetTokenHash: { type: String },
    passwordResetExpiresAt: { type: Date },
    sessions: { type: [SessionSchema], default: [] },
  },
  { timestamps: true }
);

UserSchema.index({ "sessions.tokenHash": 1, "sessions.expiresAt": 1 });
UserSchema.index({ emailVerificationTokenHash: 1, emailVerificationExpiresAt: 1 });
UserSchema.index({ passwordResetTokenHash: 1, passwordResetExpiresAt: 1 });
UserSchema.index({ familyId: 1, role: 1, name: 1 });

export const User = models.User || mongoose.model("User", UserSchema);
