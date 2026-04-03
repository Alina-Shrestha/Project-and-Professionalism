import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { signToken } from "@/lib/auth-token";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const identifier = typeof email === "string" ? email.trim() : "";

    if (!identifier || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    }).lean();

    if (!user) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const storedHash = String(user.passwordHash || "");
    const isBcryptHash = storedHash.startsWith("$2");
    const isValidPassword = isBcryptHash
      ? await bcrypt.compare(password, storedHash)
      : password === storedHash;

    if (!isValidPassword) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const normalizedName =
      typeof user.name === "string" && user.name.trim()
        ? user.name
        : (user as any).username || "User";
    const normalizedEmail =
      typeof user.email === "string" && user.email.trim()
        ? user.email
        : (user as any).username || "";

    const token = signToken({
      id: String(user._id),
      name: normalizedName,
      email: normalizedEmail,
    });

    return NextResponse.json({
      token,
      user: {
        _id: String(user._id),
        name: normalizedName,
        email: normalizedEmail,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
