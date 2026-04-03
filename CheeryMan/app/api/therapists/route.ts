import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Therapist } from "@/models/Therapist";
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

function getAdminEmails() {
  const fromList = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  const single = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  if (single) fromList.push(single);
  return new Set(fromList);
}

function isAdminUser(email?: string) {
  if (!email) return false;
  const admins = getAdminEmails();
  return admins.has(email.trim().toLowerCase());
}

export async function GET(req: NextRequest) {
  const payload = getPayload(req);
  if (!payload) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  await connectDB();
  const includeInactive = req.nextUrl.searchParams.get("includeInactive") === "true";
  if (includeInactive && !isAdminUser(payload.email)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const query = includeInactive ? {} : { active: true };
  const therapists = await Therapist.find(query).sort({ experienceYears: -1 }).lean();
  return NextResponse.json({ success: true, data: therapists });
}

export async function POST(req: NextRequest) {
  const payload = getPayload(req);
  if (!payload) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!isAdminUser(payload.email)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, specialization, experienceYears, contact, city } = body;

  if (!name || !specialization || typeof experienceYears !== "number" || !contact) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  await connectDB();
  const therapist = await Therapist.create({
    name,
    specialization,
    experienceYears,
    contact,
    city: typeof city === "string" ? city : "",
  });

  return NextResponse.json({ success: true, data: therapist }, { status: 201 });
}
