import mongoose, { Schema, models } from "mongoose";

const RecipeSchema = new Schema(
  {
    familyId: { type: String, required: true },
    memberName: { type: String, required: true },
    medicationName: { type: String, required: true },
    recipeCode: { type: String },
    doctor: { type: String },
    renewalDate: { type: Date },
    status: {
      type: String,
      enum: ["active", "to-renew", "renewed"],
      default: "active",
    },
    notes: { type: String },
  },
  { timestamps: true }
);

RecipeSchema.index({ familyId: 1, renewalDate: 1 });
RecipeSchema.index({ familyId: 1, createdAt: -1 });
RecipeSchema.index({ familyId: 1, memberName: 1, renewalDate: 1 });

export const Recipe = models.Recipe || mongoose.model("Recipe", RecipeSchema);
