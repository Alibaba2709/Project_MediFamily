import mongoose, { Schema, models } from "mongoose";

const NotificationStateSchema = new Schema(
  {
    familyId: { type: String, required: true },
    userId: { type: String, required: true },
    notificationId: { type: String, required: true },
    readAt: { type: Date },
    dismissedAt: { type: Date },
  },
  { timestamps: true }
);

NotificationStateSchema.index(
  { userId: 1, notificationId: 1 },
  { unique: true }
);
NotificationStateSchema.index({ familyId: 1, userId: 1, readAt: 1 });

export const NotificationState =
  models.NotificationState ||
  mongoose.model("NotificationState", NotificationStateSchema);
