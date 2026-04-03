import { NextRequest, NextResponse } from "next/server";
import {
  addLocalMessage,
  generateHfReply,
} from "@/lib/server/chat-fallback";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ||
  "https://ai-therapist-agent-backend.onrender.com";

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  let currentMessage = "";
  try {
    const { sessionId } = params;
    const body = await req.json();
    const { message } = body;
    currentMessage = String(message || "");
    const authHeader =
      req.headers.get("authorization") || req.headers.get("Authorization");

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Always persist local history so fallback sessions stay usable.
    addLocalMessage(sessionId, "user", message);

    const formatReply = (value: string) =>
      value
        .replace(/[#*_|]/g, "")
        .replace(/(-{3,}|={3,})/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

    const replyWithHf = async () => {
      const generated = await generateHfReply(sessionId, message);
      const cleanedReply = formatReply(generated);
      addLocalMessage(sessionId, "assistant", cleanedReply);

      return NextResponse.json({
        reply: cleanedReply,
        response: cleanedReply,
        message: cleanedReply,
      });
    };

    const preferLocalModel = process.env.CHAT_USE_LOCAL_LLM !== "false";

    if (!authHeader || preferLocalModel) {
      return replyWithHf();
    }

    console.log(`Sending message to session ${sessionId}:`, message);
    const response = await fetch(
      `${BACKEND_API_URL}/chat/sessions/${sessionId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify({ message }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Failed to send message:", error);
      return replyWithHf();
    }

    const data = await response.json();
    console.log("Message sent successfully:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error sending message:", error);
    const { sessionId } = params;
    const fallbackReply = await generateHfReply(
      sessionId,
      currentMessage || "I need support right now."
    );
    const cleanedReply = fallbackReply
      .replace(/[#*_|]/g, "")
      .replace(/(-{3,}|={3,})/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    addLocalMessage(sessionId, "assistant", cleanedReply);

    return NextResponse.json({
      reply: cleanedReply,
      response: cleanedReply,
      message: cleanedReply,
    });
  }
}
