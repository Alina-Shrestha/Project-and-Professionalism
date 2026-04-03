import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth-token";
import { DailyWellnessSnapshot } from "@/models/DailyWellnessSnapshot";
import { startOfDay } from "date-fns";

export async function GET(request: Request) {
  try {
    await connectDB();
    const auth = request.headers.get("authorization") || request.headers.get("Authorization");
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload?.id) return Response.json({ error: "Invalid token" }, { status: 401 });

    const snapshots = await DailyWellnessSnapshot.find({ userId: payload.id }).sort({
      date: -1,
    });
    return Response.json(snapshots);
  } catch (error) {
    console.error("Error fetching snapshots:", error);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const auth = request.headers.get("authorization") || request.headers.get("Authorization");
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload?.id) return Response.json({ error: "Invalid token" }, { status: 401 });

    const { moodScore, completionRate, totalActivities } = await request.json();

    const snapshot = await DailyWellnessSnapshot.findOneAndUpdate(
      { userId: payload.id, date: startOfDay(new Date()) },
      {
        userId: payload.id,
        date: startOfDay(new Date()),
        moodScore: typeof moodScore === "number" ? moodScore : 0,
        completionRate: typeof completionRate === "number" ? completionRate : 0,
        totalActivities: typeof totalActivities === "number" ? totalActivities : 0,
      },
      { upsert: true, new: true }
    );

    return Response.json(snapshot);
  } catch (error) {
    console.error("Error saving snapshot:", error);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}
