import { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    username: { type: String, trim: true, unique: true, sparse: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    onboardingCompleted: { type: Boolean, default: false },
    onboardingCompletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

export const User = models.User || model("User", UserSchema);
