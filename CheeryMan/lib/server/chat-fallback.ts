interface StoredChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface StoredChatSession {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  messages: StoredChatMessage[];
}

type ChatStore = Map<string, StoredChatSession>;

const globalForChat = globalThis as typeof globalThis & {
  __CHAT_FALLBACK_STORE__?: ChatStore;
};

const store: ChatStore = globalForChat.__CHAT_FALLBACK_STORE__ ?? new Map();
if (!globalForChat.__CHAT_FALLBACK_STORE__) {
  globalForChat.__CHAT_FALLBACK_STORE__ = store;
}

const DEFAULT_MODEL = process.env.HF_MODEL || "openai/gpt-oss-120b";

const SYSTEM_PROMPT = `
You are MindMate, a warm, emotionally intelligent AI companion.
You should feel like a trusted friend who listens deeply while staying safe and respectful.

Response style:
- Use plain text only, no markdown symbols.
- Keep responses natural, warm, and easy to read.
- Start by acknowledging the user's feeling in 1 sentence.
- Then offer 1 to 3 practical, gentle suggestions.
- Ask one thoughtful follow-up question when helpful.
- Keep replies concise (roughly 4 to 8 sentences unless the user asks for depth).

Safety:
- Never shame, judge, or dismiss feelings.
- If user mentions self-harm or danger, encourage immediate real-world support and emergency help in calm language.
- Do not provide medical diagnosis.
`;

const getOrCreateSession = (sessionId: string): StoredChatSession => {
  const existing = store.get(sessionId);
  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();
  const created: StoredChatSession = {
    sessionId,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };

  store.set(sessionId, created);
  return created;
};

export const createLocalSession = () => {
  const sessionId = crypto.randomUUID();
  getOrCreateSession(sessionId);
  return { sessionId };
};

export const listLocalSessions = (): StoredChatSession[] => {
  return [...store.values()].sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
};

export const getLocalHistory = (sessionId: string): StoredChatMessage[] => {
  return [...getOrCreateSession(sessionId).messages];
};

export const addLocalMessage = (
  sessionId: string,
  role: "user" | "assistant",
  content: string
): StoredChatMessage => {
  const session = getOrCreateSession(sessionId);
  const message: StoredChatMessage = {
    role,
    content,
    timestamp: new Date().toISOString(),
  };

  session.messages.push(message);
  session.updatedAt = message.timestamp;
  store.set(sessionId, session);

  return message;
};

const buildHfMessages = (sessionId: string, userMessage: string) => {
  const history = getLocalHistory(sessionId)
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content }));

  const trimmedIncoming = userMessage.trim();
  const lastHistoryMessage = history[history.length - 1];
  const shouldAppendIncoming = !(
    lastHistoryMessage?.role === "user" &&
    lastHistoryMessage.content.trim() === trimmedIncoming
  );

  return [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
    ...(shouldAppendIncoming
      ? [{ role: "user" as const, content: userMessage }]
      : []),
  ];
};

export const generateHfReply = async (
  sessionId: string,
  userMessage: string
): Promise<string> => {
  const apiKey = process.env.HF_API_KEY;
  if (!apiKey) {
    return "I am here with you. To enable AI responses, add HF_API_KEY to your .env.local and restart the app.";
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: buildHfMessages(sessionId, userMessage),
        max_tokens: 350,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Hugging Face API error:", errorText);
      return "I am having trouble reaching the AI service right now. Please try again in a moment.";
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (typeof content === "string" && content.trim().length > 0) {
      return content
        .replace(/[#*_|]/g, "")
        .replace(/(-{3,}|={3,})/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    }

    return "Thank you for sharing that. I am here to listen. Could you tell me a little more about what you are feeling right now?";
  } catch (error) {
    console.error("Hugging Face request failed:", error);
    return "I am having trouble connecting right now. Please try again shortly.";
  } finally {
    clearTimeout(timeout);
  }
};
