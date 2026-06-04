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

export const Visit = models.Visit || mongoose.model("Visit", VisitSchema);
