import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ErpRecord } from "@/models/ErpRecord";
import { verifyToken } from "@/lib/auth-token";

const ERP_TASKS = [
  { id: "erp-1", title: "Delay reassurance for 5 minutes", level: "easy" },
  { id: "erp-2", title: "Touch object and wait before washing", level: "medium" },
  { id: "erp-3", title: "Write intrusive thought without neutralizing", level: "medium" },
  { id: "erp-4", title: "Leave minor uncertainty unresolved", level: "hard" },
];

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
  const records = await ErpRecord.find({ userId: payload.id }).sort({ createdAt: -1 }).limit(20).lean();
  return NextResponse.json({ success: true, data: { tasks: ERP_TASKS, records } });
}

export async function POST(req: NextRequest) {
  const payload = getPayload(req);
  if (!payload) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { taskId, taskTitle, anxietyBefore, anxietyAfter, notes } = body;

  if (!taskId || !taskTitle) {
    return NextResponse.json({ error: "Task information is required" }, { status: 400 });
  }

  if (typeof anxietyBefore !== "number" || typeof anxietyAfter !== "number") {
    return NextResponse.json({ error: "Anxiety ratings are required" }, { status: 400 });
  }

  await connectDB();
  const record = await ErpRecord.create({
    userId: payload.id,
    taskId,
    taskTitle,
    anxietyBefore,
    anxietyAfter,
    notes: typeof notes === "string" ? notes : "",
  });

  return NextResponse.json({ success: true, data: record }, { status: 201 });
}
