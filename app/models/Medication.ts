import mongoose, { Schema, models } from "mongoose";

const MedicationSchema = new Schema(
  {
    familyId: { type: String, required: true },
    memberName: { type: String, required: true },
    name: { type: String, required: true },
    dosage: { type: String },
    stockQuantity: { type: Number },
    stockUnit: { type: String },
    unitsPerDose: { type: Number, default: 1 },
    lowStockThreshold: { type: Number },
    intakeTime: { type: String },
    intakeTimes: [{ type: String }],
    frequency: {
      type: String,
      enum: ["daily", "specific_days", "as_needed"],
      default: "daily",
    },
    weekdays: [{ type: Number }],
    schedule: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    active: { type: Boolean, default: true },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Medication =
  models.Medication || mongoose.model("Medication", MedicationSchema);
