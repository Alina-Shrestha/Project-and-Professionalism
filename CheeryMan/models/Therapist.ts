import { Schema, model, models } from "mongoose";

const TherapistSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    specialization: { type: String, required: true, trim: true },
    experienceYears: { type: Number, required: true, min: 0 },
    contact: { type: String, required: true, trim: true },
    city: { type: String, default: "", trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Therapist = models.Therapist || model("Therapist", TherapistSchema);
