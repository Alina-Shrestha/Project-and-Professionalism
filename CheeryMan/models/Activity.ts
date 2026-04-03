import { Schema, model, models } from "mongoose";

const ActivitySchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ["meditation", "exercise", "walking", "reading", "journaling", "therapy"],
    },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    duration: { type: Number, min: 0, default: 0 },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Activity = models.Activity || model("Activity", ActivitySchema);
