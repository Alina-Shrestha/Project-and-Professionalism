import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Mood } from "@/models/Mood";
import { verifyToken } from "@/lib/auth-token";

function getAuthPayload(req: NextRequest) {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return null;
  }

  try {
    return verifyToken(auth.slice(7));
  } catch {
    return null;
  }
}

function getPeriodStartDate(period: string) {
  const now = new Date();
  const start = new Date(now);

  if (period === "year") {
    start.setFullYear(now.getFullYear() - 1);
  } else if (period === "month") {
    start.setMonth(now.getMonth() - 1);
  } else {
    start.setDate(now.getDate() - 7);
  }

  return start;
}

export async function GET(req: NextRequest) {
  const payload = getAuthPayload(req);
  if (!payload) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const period = req.nextUrl.searchParams.get("period") || "week";
    const fromDate = getPeriodStartDate(period);

    await connectDB();
    const moods = await Mood.find({
      $or: [
        { userId: payload.id },
        { username: payload.email },
        { username: payload.name },
        { email: payload.email },
      ],
      createdAt: { $gte: fromDate },
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!moods.length) {
      return NextResponse.json({
        success: true,
        data: {
          average: 0,
          count: 0,
          highest: 0,
          lowest: 0,
          history: [],
        },
      });
    }

    const scores = moods
      .map((m: any) =>
        typeof m.score === "number"
          ? m.score
          : typeof m.mood === "number"
          ? m.mood
          : null
      )
      .filter((value): value is number => typeof value === "number");

    if (!scores.length) {
      return NextResponse.json({
        success: true,
        data: {
          average: 0,
          count: 0,
          highest: 0,
          lowest: 0,
          history: [],
        },
      });
    }

    const total = scores.reduce((acc, score) => acc + score, 0);

    return NextResponse.json({
      success: true,
      data: {
        average: Number((total / scores.length).toFixed(2)),
        count: scores.length,
        highest: Math.max(...scores),
        lowest: Math.min(...scores),
        history: moods,
      },
    });
  } catch (error) {
    console.error("Mood stats error:", error);
    return NextResponse.json(
      { message: "Failed to fetch mood statistics" },
      { status: 500 }
    );
  }
}
