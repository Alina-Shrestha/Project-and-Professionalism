import { Schema, model, models } from "mongoose";

const TriggerLogSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    situation: { type: String, required: true, trim: true },
    thought: { type: String, required: true, trim: true },
    reaction: { type: String, required: true, trim: true },
    intensity: { type: Number, required: true, min: 1, max: 10 },
  },
  { timestamps: true }
);

export const TriggerLog = models.TriggerLog || model("TriggerLog", TriggerLogSchema);
