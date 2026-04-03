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

export async function GET(req: NextRequest) {
  const payload = getAuthPayload(req);
  if (!payload) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = Number(searchParams.get("limit") || "30");

    const userSignals = [payload.id, payload.email, payload.name].filter(Boolean);

    const query: {
      $or: Array<Record<string, string>>;
      createdAt?: { $gte?: Date; $lte?: Date };
    } = {
      $or: [
        { userId: payload.id },
        { username: payload.email },
        { username: payload.name },
        { email: payload.email },
      ],
    };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    await connectDB();
    const moods = await Mood.find(query).sort({ createdAt: -1 }).limit(limit).lean();

    const normalized = moods.map((entry: any) => ({
      _id: String(entry._id),
      score:
        typeof entry.score === "number"
          ? entry.score
          : typeof entry.mood === "number"
          ? entry.mood
          : 0,
      note: typeof entry.note === "string" ? entry.note : "",
      createdAt: entry.createdAt || entry.timestamp,
    }));

    return NextResponse.json({ success: true, data: normalized });
  } catch (error) {
    console.error("Mood history error:", error);
    return NextResponse.json({ message: "Failed to fetch mood history" }, { status: 500 });
  }
}
