import { Schema, model, models } from "mongoose";

const JournalEntrySchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    moodScore: { type: Number, min: 0, max: 100, default: null },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const JournalEntry =
  models.JournalEntry || model("JournalEntry", JournalEntrySchema);
