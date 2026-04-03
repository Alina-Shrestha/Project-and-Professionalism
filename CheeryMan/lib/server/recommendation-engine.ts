import { Activity } from "@/models/Activity";
import { JournalEntry } from "@/models/JournalEntry";
import { Mood } from "@/models/Mood";
import { Therapist } from "@/models/Therapist";
import { TriggerLog } from "@/models/TriggerLog";

export type OnboardingResponses = {
  intrusiveThoughts: number;
  compulsions: number;
  distress: number;
  selectedTypes: string[];
  frequency: number;
  interference: number;
  resistanceDifficulty: number;
  timeSpent: number;
  priorTherapy: string;
  openToERP: boolean;
  wantsTherapist: boolean;
};

export type RecommendationSummary = {
  onboardingSeverity: number;
  riskScore: number;
  severityLevel: "low" | "moderate" | "high";
  urgency: "routine" | "soon" | "priority";
  reasons: string[];
  suggestedSpecializations: string[];
};

function buildFallbackTherapists(
  suggestedSpecializations: string[],
  limit: number
) {
  const primaryFocus = suggestedSpecializations[0] || "OCD";

  const fallback = [
    {
      _id: "fallback-1",
      name: "Dr. Asha Verma",
      specialization: `${primaryFocus}, ERP, CBT`,
      experienceYears: 11,
      contact: "contact@mindcare.example",
      city: "Remote",
      active: true,
    },
    {
      _id: "fallback-2",
      name: "Dr. Rohan Khadka",
      specialization: "OCD, Anxiety, Exposure Therapy",
      experienceYears: 9,
      contact: "care@serenityclinic.example",
      city: "Kathmandu",
      active: true,
    },
    {
      _id: "fallback-3",
      name: "Dr. Mira Shrestha",
      specialization: "ERP, Intrusive Thoughts, CBT",
      experienceYears: 8,
      contact: "help@calmbridge.example",
      city: "Pokhara",
      active: true,
    },
  ];

  return fallback.slice(0, limit);
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function computeOnboardingSeverity(responses: OnboardingResponses) {
  const signals = [
    responses.intrusiveThoughts,
    responses.compulsions,
    responses.distress,
    responses.frequency,
    responses.interference,
    responses.resistanceDifficulty,
    responses.timeSpent,
  ];

  const average = signals.reduce((sum, value) => sum + value, 0) / signals.length;
  return clamp(average / 3);
}

function extractSuggestedSpecializations(types: string[]) {
  if (!types.length) {
    return ["OCD", "ERP", "Anxiety", "CBT"];
  }

  const mapping: Record<string, string[]> = {
    contamination: ["OCD", "ERP", "Anxiety"],
    checking: ["OCD", "ERP", "CBT"],
    symmetry: ["OCD", "CBT", "Anxiety"],
    intrusive: ["OCD", "ERP", "CBT"],
    "mental-rituals": ["OCD", "ERP", "CBT"],
    hoarding: ["Hoarding", "OCD", "CBT"],
  };

  const merged = new Set<string>();
  types.forEach((type) => {
    (mapping[type] || ["OCD", "ERP"]).forEach((item) => merged.add(item));
  });

  return Array.from(merged);
}

async function computeBehaviorSignal(userId: string) {
  const since = new Date();
  since.setDate(since.getDate() - 14);

  const [moods, triggers, activities, journals] = await Promise.all([
    Mood.find({ userId, createdAt: { $gte: since } }).select("score").lean(),
    TriggerLog.find({ userId, createdAt: { $gte: since } })
      .select("intensity")
      .lean(),
    Activity.find({ userId, createdAt: { $gte: since } }).select("_id").lean(),
    JournalEntry.find({ userId, createdAt: { $gte: since } })
      .select("content")
      .lean(),
  ]);

  const moodAverage = moods.length
    ? moods.reduce((sum, item: any) => sum + (item.score || 0), 0) / moods.length
    : 50;
  const moodRisk = clamp((100 - moodAverage) / 100);

  const triggerAverage = triggers.length
    ? triggers.reduce((sum, item: any) => sum + (item.intensity || 0), 0) / triggers.length
    : 5;
  const triggerRisk = clamp(triggerAverage / 10);

  const adherenceRisk = clamp(1 - activities.length / 10);

  const distressPattern = /(panic|overwhelm|afraid|anxious|scared|cannot stop|distress)/i;
  const distressMentions = journals.reduce((count, item: any) => {
    if (typeof item.content === "string" && distressPattern.test(item.content)) {
      return count + 1;
    }
    return count;
  }, 0);
  const journalRisk = journals.length ? clamp(distressMentions / journals.length) : 0.3;

  return {
    moodRisk,
    triggerRisk,
    adherenceRisk,
    journalRisk,
  };
}

export async function buildRecommendationSummary(
  userId: string,
  onboardingSeverity: number,
  selectedTypes: string[]
): Promise<RecommendationSummary> {
  const behavior = await computeBehaviorSignal(userId);

  const riskScore = clamp(
    0.35 * onboardingSeverity +
      0.30 * behavior.triggerRisk +
      0.20 * behavior.moodRisk +
      0.15 * ((behavior.adherenceRisk + behavior.journalRisk) / 2)
  );

  const severityLevel =
    riskScore >= 0.7 ? "high" : riskScore >= 0.4 ? "moderate" : "low";

  const urgency =
    riskScore >= 0.7 ? "priority" : riskScore >= 0.4 ? "soon" : "routine";

  const reasons: string[] = [];
  if (onboardingSeverity >= 0.6) reasons.push("High symptom burden in onboarding.");
  if (behavior.triggerRisk >= 0.6) reasons.push("Frequent or intense trigger patterns.");
  if (behavior.moodRisk >= 0.6) reasons.push("Mood trend suggests elevated emotional strain.");
  if (behavior.adherenceRisk >= 0.6) reasons.push("Low activity adherence in the last 14 days.");
  if (behavior.journalRisk >= 0.6) reasons.push("Journal entries include repeated distress markers.");

  return {
    onboardingSeverity,
    riskScore,
    severityLevel,
    urgency,
    reasons,
    suggestedSpecializations: extractSuggestedSpecializations(selectedTypes),
  };
}

export async function getRecommendedTherapists(
  suggestedSpecializations: string[],
  limit = 5
) {
  const keywords = suggestedSpecializations.map((item) => new RegExp(item, "i"));
  const query = keywords.length
    ? {
        active: true,
        $or: keywords.map((keyword) => ({ specialization: keyword })),
      }
    : { active: true };

  const therapists = await Therapist.find(query)
    .sort({ experienceYears: -1, createdAt: -1 })
    .limit(limit)
    .lean();

  if (therapists.length > 0) {
    return therapists;
  }

  const generalTherapists = await Therapist.find({ active: true })
    .sort({ experienceYears: -1, createdAt: -1 })
    .limit(limit)
    .lean();

  if (generalTherapists.length > 0) {
    return generalTherapists;
  }

  return buildFallbackTherapists(suggestedSpecializations, limit);
}
