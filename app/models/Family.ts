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
    notificationSettings: {
      emailEnabled: { type: Boolean, default: true },
      visitDaysBefore: { type: Number, default: 1 },
      recipeDaysBefore: { type: Number, default: 7 },
      paymentEnabled: { type: Boolean, default: true },
      cancellationEnabled: { type: Boolean, default: true },
      recipeEnabled: { type: Boolean, default: true },
      documentEnabled: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export const Family =
  models.Family || mongoose.model("Family", FamilySchema);
