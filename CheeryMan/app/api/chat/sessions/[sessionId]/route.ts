import { NextRequest, NextResponse } from "next/server";
import { getLocalHistory, addLocalMessage, generateHfReply } from "@/lib/server/chat-fallback";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ||
  "https://ai-therapist-agent-backend.onrender.com";

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    const authHeader =
      req.headers.get("authorization") || req.headers.get("Authorization");

    if (!authHeader) {
      return NextResponse.json(getLocalHistory(sessionId));
    }

    const response = await fetch(
      `${BACKEND_API_URL}/chat/sessions/${sessionId}/history`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in chat history API:", error);
    return NextResponse.json(getLocalHistory(params.sessionId));
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  let currentMessage = "";
  try {
    const { sessionId } = params;
    const { message } = await req.json();
    currentMessage = String(message || "");
    const authHeader =
      req.headers.get("authorization") || req.headers.get("Authorization");

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    addLocalMessage(sessionId, "user", message);

    if (!authHeader) {
      const reply = await generateHfReply(sessionId, message);
      addLocalMessage(sessionId, "assistant", reply);
      return NextResponse.json({ response: reply, message: reply, reply });
    }

    const response = await fetch(
      `${BACKEND_API_URL}/chat/sessions/${sessionId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in chat API:", error);
    const sessionId = params.sessionId;
    const fallbackReply = await generateHfReply(
      sessionId,
      currentMessage || "I need support right now."
    );
    addLocalMessage(sessionId, "assistant", fallbackReply);
    return NextResponse.json({ response: fallbackReply, message: fallbackReply, reply: fallbackReply });
  }
}
