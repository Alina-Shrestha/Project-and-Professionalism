import { NextRequest, NextResponse } from "next/server";

import { verifyToken } from "@/lib/auth-token";
import { connectDB } from "@/lib/mongodb";
import {
  buildRecommendationSummary,
  getRecommendedTherapists,
} from "@/lib/server/recommendation-engine";
import { OnboardingAssessment } from "../../../../models/OnboardingAssessment";

function getPayload(req: NextRequest) {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    return verifyToken(auth.slice(7));
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const payload = getPayload(req);
  if (!payload) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  await connectDB();

  const assessment = await OnboardingAssessment.findOne({ userId: payload.id }).lean();
  if (!assessment) {
    return NextResponse.json(
      { message: "Complete onboarding first" },
      { status: 400 }
    );
  }

  const summary = await buildRecommendationSummary(
    payload.id,
    Number(assessment.summary?.onboardingSeverity || 0),
    Array.isArray(assessment.responses?.selectedTypes)
      ? assessment.responses.selectedTypes
      : []
  );

  await OnboardingAssessment.updateOne(
    { userId: payload.id },
    {
      $set: {
        summary,
      },
    }
  );

  const therapists = await getRecommendedTherapists(summary.suggestedSpecializations, 5);
  const isFallback = therapists.every((item: any) =>
    String(item?._id || "").startsWith("fallback-")
  );

  return NextResponse.json({
    success: true,
    summary,
    dataSource: isFallback ? "fallback" : "directory",
    data: therapists,
  });
}
