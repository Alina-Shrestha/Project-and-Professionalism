import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `
You are a calm, compassionate, and supportive therapist-like assistant.
Your goal is to respond to the user as if you are speaking directly to them, with empathy and understanding.

STRICT RULES:
- Do NOT use #, *, _,-, or any markdown formatting.
- Do not use tables or lists with symbols. If listing steps, use plain text like "Step 1: ...".
- Keep your responses empathetic, concise, clear, and gentle.
- Focus only on what the user asked or how they are feeling.
- Always respond as a human therapist would: warm, validating, and non-judgmental.
- Avoid technical, irrelevant, or harsh language.
- Use only plain text.
- Avoid irrelevant information; stay focused on the user's question.
- Do NOT use insensitive or harsh language.
- If you need to list items, use plain text like "Step 1: ..." without symbols in separate paragraphs.
Always review your response to make sure it follows these rules.
`;

const cleanReply = (reply: string) =>
  reply
    .replace(/[#*_|]/g, "")
    .replace(/(-{3,}|={3,})/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const hfToken = process.env.HF_API_KEY;
    const hfModel = process.env.HF_MODEL || "openai/gpt-oss-120b";

    if (!hfToken) {
      return NextResponse.json(
        { reply: "Missing HF API key" },
        { status: 500 }
      );
    }

    const res = await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: hfModel,
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: String(message || ""),
          },
        ],
        temperature: 0.7,
      }),
    });

    const data = await res.json();

    let reply = data?.choices?.[0]?.message?.content || "No response";
    reply = cleanReply(reply);

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return NextResponse.json(
      { reply: "Server error occurred." },
      { status: 500 }
    );
  }
}
