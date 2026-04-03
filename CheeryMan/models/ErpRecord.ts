import { Schema, model, models } from "mongoose";

const ErpRecordSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    taskId: { type: String, required: true, trim: true },
    taskTitle: { type: String, required: true, trim: true },
    anxietyBefore: { type: Number, required: true, min: 0, max: 10 },
    anxietyAfter: { type: Number, required: true, min: 0, max: 10 },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export const ErpRecord = models.ErpRecord || model("ErpRecord", ErpRecordSchema);
