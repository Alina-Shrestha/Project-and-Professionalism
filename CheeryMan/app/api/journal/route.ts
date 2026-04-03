import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { JournalEntry } from "@/models/JournalEntry";
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
  const entries = await JournalEntry.find({ userId: payload.id }).sort({ createdAt: -1 }).limit(50).lean();
  return NextResponse.json({ success: true, data: entries });
}

export async function POST(req: NextRequest) {
  const payload = getPayload(req);
  if (!payload) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, content, moodScore, tags } = body;
  if (!title || !content) {
    return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
  }

  await connectDB();
  const entry = await JournalEntry.create({
    userId: payload.id,
    title: String(title),
    content: String(content),
    moodScore: typeof moodScore === "number" ? moodScore : null,
    tags: Array.isArray(tags) ? tags.filter((t) => typeof t === "string").slice(0, 6) : [],
  });

  return NextResponse.json({ success: true, data: entry }, { status: 201 });
}
