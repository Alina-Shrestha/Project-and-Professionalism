import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Mood } from "@/models/Mood";
import { verifyToken } from "@/lib/auth-token";

function getTokenFromRequest(req: NextRequest) {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return null;
  }
  return auth.slice(7);
}

export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req);

  if (!token) {
    return NextResponse.json({ message: "No token provided" }, { status: 401 });
  }

  try {
    const payload = verifyToken(token);
    const body = await req.json();
    const { score, note, energy, stress, tags } = body;

    if (typeof score !== "number" || score < 0 || score > 100) {
      return NextResponse.json({ error: "Invalid mood score" }, { status: 400 });
    }

    const parsedEnergy =
      typeof energy === "number" ? Math.round(energy) : 3;
    const parsedStress =
      typeof stress === "number" ? Math.round(stress) : 3;

    if (parsedEnergy < 1 || parsedEnergy > 5) {
      return NextResponse.json({ error: "Invalid energy value" }, { status: 400 });
    }

    if (parsedStress < 1 || parsedStress > 5) {
      return NextResponse.json({ error: "Invalid stress value" }, { status: 400 });
    }

    const parsedTags = Array.isArray(tags)
      ? tags.filter((tag) => typeof tag === "string").slice(0, 5)
      : [];

    await connectDB();
    const mood = await Mood.create({
      userId: payload.id,
      score,
      energy: parsedEnergy,
      stress: parsedStress,
      tags: parsedTags,
      note: typeof note === "string" ? note : "",
    });

    return NextResponse.json({ success: true, data: mood }, { status: 201 });
  } catch (error) {
    console.error("Error tracking mood:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
