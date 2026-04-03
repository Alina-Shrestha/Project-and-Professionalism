import { NextRequest, NextResponse } from "next/server";
import { getLocalHistory } from "@/lib/server/chat-fallback";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ||
  "https://ai-therapist-agent-backend.onrender.com";

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    const localHistory = getLocalHistory(sessionId);
    if (localHistory.length > 0) {
      return NextResponse.json(localHistory);
    }

    const authHeader =
      req.headers.get("authorization") || req.headers.get("Authorization");
    console.log(`Getting chat history for session ${sessionId}`);

    if (!authHeader) {
      return NextResponse.json(getLocalHistory(sessionId));
    }

    const response = await fetch(
      `${BACKEND_API_URL}/chat/sessions/${sessionId}/history`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Failed to get chat history:", error);
      return NextResponse.json(getLocalHistory(sessionId));
    }

    const data = await response.json();
    console.log("Chat history retrieved successfully:", data);

    // Format the response to match the frontend's expected format
    const formattedMessages = data.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
    }));

    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error("Error getting chat history:", error);
    const sessionId = params.sessionId;
    return NextResponse.json(getLocalHistory(sessionId));
  }
}
