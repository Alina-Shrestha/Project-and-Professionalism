import { Schema, model, models } from "mongoose";

const OnboardingAssessmentSchema = new Schema(
  {
    userId: { type: String, required: true, index: true, unique: true },
    responses: {
      intrusiveThoughts: { type: Number, required: true, min: 0, max: 3 },
      compulsions: { type: Number, required: true, min: 0, max: 3 },
      distress: { type: Number, required: true, min: 0, max: 3 },
      selectedTypes: { type: [String], default: [] },
      frequency: { type: Number, required: true, min: 0, max: 3 },
      interference: { type: Number, required: true, min: 0, max: 3 },
      resistanceDifficulty: { type: Number, required: true, min: 0, max: 3 },
      timeSpent: { type: Number, required: true, min: 0, max: 3 },
      priorTherapy: { type: String, default: "none" },
      openToERP: { type: Boolean, default: false },
      wantsTherapist: { type: Boolean, default: false },
    },
    summary: {
      onboardingSeverity: { type: Number, required: true, min: 0, max: 1 },
      riskScore: { type: Number, required: true, min: 0, max: 1 },
      severityLevel: {
        type: String,
        required: true,
        enum: ["low", "moderate", "high"],
      },
      urgency: {
        type: String,
        required: true,
        enum: ["routine", "soon", "priority"],
      },
      reasons: { type: [String], default: [] },
      suggestedSpecializations: { type: [String], default: [] },
    },
  },
  { timestamps: true }
);

export const OnboardingAssessment =
  models.OnboardingAssessment ||
  model("OnboardingAssessment", OnboardingAssessmentSchema);
