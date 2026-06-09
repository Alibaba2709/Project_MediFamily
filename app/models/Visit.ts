import mongoose, { Schema, models } from "mongoose";

const VisitSchema = new Schema(
  {
    familyId: { type: String, required: true },
    memberName: { type: String, required: true },
    title: { type: String, required: true },
    doctor: { type: String },
    location: { type: String },
    visitDate: { type: Date, required: true },
    visitTime: { type: String },
    paymentDueDate: { type: Date },
    cancellationDueDate: { type: Date },
    price: { type: Number },
    status: {
      type: String,
      enum: ["booked", "paid", "cancelled", "completed"],
      default: "booked",
    },
    notes: { type: String },
  },
  { timestamps: true }
);

VisitSchema.index({ familyId: 1, visitDate: 1, visitTime: 1 });
VisitSchema.index({ familyId: 1, memberName: 1, visitDate: 1 });
VisitSchema.index({ familyId: 1, status: 1, visitDate: 1 });

export const Visit = models.Visit || mongoose.model("Visit", VisitSchema);
