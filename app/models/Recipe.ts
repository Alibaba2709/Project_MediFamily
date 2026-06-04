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

export const Recipe = models.Recipe || mongoose.model("Recipe", RecipeSchema);
