import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ForumPost } from "@/models/ForumPost";
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
  const posts = await ForumPost.find({}).sort({ createdAt: -1 }).limit(100).lean();
  return NextResponse.json({ success: true, data: posts });
}

export async function POST(req: NextRequest) {
  const payload = getPayload(req);
  if (!payload) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { alias, content, topic } = body;

  if (!content) {
    return NextResponse.json({ error: "Post content is required" }, { status: 400 });
  }

  await connectDB();
  const post = await ForumPost.create({
    userId: payload.id,
    alias: typeof alias === "string" && alias.trim() ? alias.trim() : "Anonymous",
    content: String(content),
    topic: typeof topic === "string" && topic.trim() ? topic.trim() : "general",
  });

  return NextResponse.json({ success: true, data: post }, { status: 201 });
}
