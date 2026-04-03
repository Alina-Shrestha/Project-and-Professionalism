import { Schema, model, models } from "mongoose";

const MoodSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    energy: { type: Number, min: 1, max: 5, default: 3 },
    stress: { type: Number, min: 1, max: 5, default: 3 },
    tags: { type: [String], default: [] },
    note: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

export const Mood = models.Mood || model("Mood", MoodSchema);
