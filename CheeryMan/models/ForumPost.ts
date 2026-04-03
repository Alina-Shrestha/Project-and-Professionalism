import { Schema, model, models } from "mongoose";

const ForumPostSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    alias: { type: String, default: "Anonymous", trim: true },
    content: { type: String, required: true, trim: true },
    topic: { type: String, default: "general", trim: true },
  },
  { timestamps: true }
);

export const ForumPost = models.ForumPost || model("ForumPost", ForumPostSchema);
