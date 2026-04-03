import { Schema, model, models } from "mongoose";

const DailyWellnessSnapshotSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    date: { type: Date, required: true, index: true },
    moodScore: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    totalActivities: { type: Number, default: 0 },
  },
  { timestamps: true }
);

DailyWellnessSnapshotSchema.index({ userId: 1, date: 1 }, { unique: true });

export const DailyWellnessSnapshot =
  models.DailyWellnessSnapshot ||
  model("DailyWellnessSnapshot", DailyWellnessSnapshotSchema);
