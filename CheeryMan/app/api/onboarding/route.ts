import { NextRequest, NextResponse } from "next/server";

import { verifyToken } from "@/lib/auth-token";
import { connectDB } from "@/lib/mongodb";
import {
  buildRecommendationSummary,
  computeOnboardingSeverity,
  OnboardingResponses,
} from "@/lib/server/recommendation-engine";
import { OnboardingAssessment } from "../../../models/OnboardingAssessment";
import { User } from "@/models/User";

function getPayload(req: NextRequest) {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    return verifyToken(auth.slice(7));
  } catch {
    return null;
  }
}

function parseBoolean(value: unknown) {
  return value === true;
}

function parseResponses(input: any): OnboardingResponses | null {
  if (!input || typeof input !== "object") return null;

  const num = (value: unknown) =>
    typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(3, Math.round(value))) : null;

  const intrusiveThoughts = num(input.intrusiveThoughts);
  const compulsions = num(input.compulsions);
  const distress = num(input.distress);
  const frequency = num(input.frequency);
  const interference = num(input.interference);
  const resistanceDifficulty = num(input.resistanceDifficulty);
  const timeSpent = num(input.timeSpent);

  if (
    intrusiveThoughts === null ||
    compulsions === null ||
    distress === null ||
    frequency === null ||
    interference === null ||
    resistanceDifficulty === null ||
    timeSpent === null
  ) {
    return null;
  }

  return {
    intrusiveThoughts,
    compulsions,
    distress,
    selectedTypes: Array.isArray(input.selectedTypes)
      ? input.selectedTypes.filter((item: unknown) => typeof item === "string").slice(0, 6)
      : [],
    frequency,
    interference,
    resistanceDifficulty,
    timeSpent,
    priorTherapy: typeof input.priorTherapy === "string" ? input.priorTherapy : "none",
    openToERP: parseBoolean(input.openToERP),
    wantsTherapist: parseBoolean(input.wantsTherapist),
  };
}

export async function GET(req: NextRequest) {
  const payload = getPayload(req);
  if (!payload) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  await connectDB();
  const assessment = await OnboardingAssessment.findOne({ userId: payload.id }).lean();

  if (!assessment) {
    return NextResponse.json({
      success: true,
      completed: false,
      assessment: null,
    });
  }

  return NextResponse.json({
    success: true,
    completed: true,
    assessment,
  });
}

export async function POST(req: NextRequest) {
  const payload = getPayload(req);
  if (!payload) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const responses = parseResponses(body?.responses);

  if (!responses) {
    return NextResponse.json(
      { message: "Invalid onboarding responses" },
      { status: 400 }
    );
  }

  await connectDB();

  const onboardingSeverity = computeOnboardingSeverity(responses);
  const summary = await buildRecommendationSummary(
    payload.id,
    onboardingSeverity,
    responses.selectedTypes
  );

  const assessment = await OnboardingAssessment.findOneAndUpdate(
    { userId: payload.id },
    {
      $set: {
        userId: payload.id,
        responses,
        summary,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  ).lean();

  await User.updateOne(
    { _id: payload.id },
    {
      $set: {
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
      },
    }
  );

  return NextResponse.json({
    success: true,
    completed: true,
    assessment,
  });
}
