import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { TriggerLog } from "@/models/TriggerLog";
import { verifyToken } from "@/lib/auth-token";

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
  const logs = await TriggerLog.find({ userId: payload.id }).sort({ createdAt: -1 }).limit(100).lean();
  return NextResponse.json({ success: true, data: logs });
}

export async function POST(req: NextRequest) {
  const payload = getPayload(req);
  if (!payload) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { situation, thought, reaction, intensity } = body;
  if (!situation || !thought || !reaction || typeof intensity !== "number") {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  if (intensity < 1 || intensity > 10) {
    return NextResponse.json({ error: "Intensity must be between 1 and 10" }, { status: 400 });
  }

  await connectDB();
  const log = await TriggerLog.create({
    userId: payload.id,
    situation: String(situation),
    thought: String(thought),
    reaction: String(reaction),
    intensity,
  });

  return NextResponse.json({ success: true, data: log }, { status: 201 });
}
