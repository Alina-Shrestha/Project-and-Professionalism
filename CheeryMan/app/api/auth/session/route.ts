import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth-token";
import { User } from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ isAuthenticated: false, user: null }, { status: 401 });
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
      return NextResponse.json({ isAuthenticated: false, user: null }, { status: 401 });
    }

    const normalizedUser = {
      _id: String(user._id),
      name: user.name || user.username || payload.name || "User",
      email: user.email || user.username || payload.email || "",
    };

    return NextResponse.json({
      isAuthenticated: true,
      user: normalizedUser,
    });
  } catch (error) {
    console.error("Error getting auth session:", error);
    return NextResponse.json({ isAuthenticated: false, user: null }, { status: 401 });
  }
}
