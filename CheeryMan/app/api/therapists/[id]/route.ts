import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Therapist } from "@/models/Therapist";
import { verifyToken } from "@/lib/auth-token";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

function unauthorized(req: NextRequest) {
  const payload = getPayload(req);
  if (!payload) return { payload: null, error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  if (!isAdminUser(payload.email)) {
    return { payload, error: NextResponse.json({ message: "Forbidden" }, { status: 403 }) };
  }
  return { payload, error: null };
}

export async function PUT(req: NextRequest, context: RouteContext) {
  const authResult = unauthorized(req);
  if (authResult.error) return authResult.error;

  const { id } = await context.params;
  const body = await req.json();
  const updates: {
    name?: string;
    specialization?: string;
    experienceYears?: number;
    contact?: string;
    city?: string;
    active?: boolean;
  } = {};

  if (typeof body.name === "string") updates.name = body.name.trim();
  if (typeof body.specialization === "string") updates.specialization = body.specialization.trim();
  if (typeof body.contact === "string") updates.contact = body.contact.trim();
  if (typeof body.city === "string") updates.city = body.city.trim();
  if (typeof body.experienceYears === "number") updates.experienceYears = body.experienceYears;
  if (typeof body.active === "boolean") updates.active = body.active;

  if (
    updates.experienceYears !== undefined &&
    (Number.isNaN(updates.experienceYears) || updates.experienceYears < 0)
  ) {
    return NextResponse.json({ message: "experienceYears must be a valid non-negative number" }, { status: 400 });
  }

  await connectDB();
  const therapist = await Therapist.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).lean();

  if (!therapist) {
    return NextResponse.json({ message: "Therapist not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: therapist });
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const authResult = unauthorized(req);
  if (authResult.error) return authResult.error;

  const { id } = await context.params;

  await connectDB();
  const therapist = await Therapist.findByIdAndDelete(id).lean();

  if (!therapist) {
    return NextResponse.json({ message: "Therapist not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: "Therapist deleted" });
}
