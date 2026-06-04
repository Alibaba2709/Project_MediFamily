import mongoose, { Schema, models } from "mongoose";

const MedicationSchema = new Schema(
  {
    familyId: { type: String, required: true },
    memberName: { type: String, required: true },
    name: { type: String, required: true },
    dosage: { type: String },
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
