import mongoose, { Schema, models } from "mongoose";

const MedicationIntakeSchema = new Schema(
  {
    familyId: { type: String, required: true },
    medicationId: { type: Schema.Types.ObjectId, required: true, ref: "Medication" },
    memberName: { type: String, required: true },
    medicationName: { type: String, required: true },
    intakeDate: { type: String, required: true },
    intakeTime: { type: String, required: true },
    status: {
      type: String,
      enum: ["taken", "skipped"],
      required: true,
    },
  },
  { timestamps: true }
);

MedicationIntakeSchema.index(
  { familyId: 1, medicationId: 1, intakeDate: 1, intakeTime: 1 },
  { unique: true }
);
MedicationIntakeSchema.index({ familyId: 1, intakeDate: 1 });
MedicationIntakeSchema.index({ familyId: 1, intakeDate: -1, intakeTime: -1 });

export const MedicationIntake =
  models.MedicationIntake ||
  mongoose.model("MedicationIntake", MedicationIntakeSchema);
