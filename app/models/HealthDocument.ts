import mongoose, { Schema, models } from "mongoose";

const HealthDocumentSchema = new Schema(
  {
    familyId: { type: String, required: true },
    memberName: { type: String, required: true },
    visitId: { type: String },
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ["referto", "esame", "prescrizione", "pagamento", "altro"],
      default: "altro",
    },
    paymentDate: { type: Date },
    amount: { type: Number },
    fileName: { type: String },
    fileType: { type: String },
    fileSize: { type: Number },
    fileData: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

HealthDocumentSchema.index({ familyId: 1, createdAt: -1 });
HealthDocumentSchema.index({ familyId: 1, category: 1, createdAt: -1 });
HealthDocumentSchema.index({ familyId: 1, memberName: 1, createdAt: -1 });
HealthDocumentSchema.index({ familyId: 1, visitId: 1 });

export const HealthDocument =
  models.HealthDocument ||
  mongoose.model("HealthDocument", HealthDocumentSchema);
