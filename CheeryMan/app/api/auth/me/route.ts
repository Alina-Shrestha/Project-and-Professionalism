import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth-token";
import { User } from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "No token provided" }, { status: 401 });
    }

    const payload = verifyToken(auth.slice(7));

    await connectDB();
    const user = await User.findById(payload.id)
      .select("_id name email username")
      .lean() as
      | {
          _id: unknown;
          name?: string;
          email?: string;
          username?: string;
        }
      | null;

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        _id: String(user._id),
        name: user.name || user.username || payload.name || "User",
        email: user.email || user.username || payload.email || "",
      },
    });
  } catch (error) {
    console.error("Me route error:", error);
    return NextResponse.json({ message: "Invalid or expired token" }, { status: 401 });
  }
}
