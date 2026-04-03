"use client";

import {
  addNotification,
  requestNotificationPermission,
  sendBrowserNotification,
} from "@/lib/notifications/notification.service";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  PlusCircle,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import { ExerciseReminderNotification } from "@/components/notifications/ExerciseReminder";
import {
  createChatSession,
  sendChatMessage,
  getChatHistory,
  ChatMessage,
  getAllChatSessions,
  ChatSession,
} from "@/lib/api/chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

// Interface for exercise reminder storage
interface ExerciseReminder {
  id: string;
  exerciseName: string;
  scheduledTime: number; // timestamp
  shown: boolean;
}

const SUGGESTED_QUESTIONS = [
  { text: "How can I manage my anxiety better?" },
  { text: "I've been feeling overwhelmed lately" },
  { text: "Can we talk about improving sleep?" },
  { text: "I need help with work-life balance" },
];

const ASSISTANT_LABEL = "MindMate";

export default function TherapyPage() {
  const params = useParams();
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChatPaused, setIsChatPaused] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(
    params.sessionId as string
  );
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  // Exercise reminder state
  const [reminder, setReminder] = useState<ExerciseReminder | null>(null);
  const [showReminderBanner, setShowReminderBanner] = useState(false);

  // Load reminders from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedReminder = localStorage.getItem("exerciseReminder");
    if (storedReminder) {
      try {
        const parsed: ExerciseReminder = JSON.parse(storedReminder);
        setReminder(parsed);

        // If time already passed and not shown, show banner immediately
        const now = Date.now();
        if (now >= parsed.scheduledTime && !parsed.shown) {
          setShowReminderBanner(true);
          parsed.shown = true;
          localStorage.setItem("exerciseReminder", JSON.stringify(parsed));
          addNotification(
            "Reminder Ready",
            `Your ${parsed.exerciseName} reminder is ready.`,
            "reminder"
          );
          sendBrowserNotification(
            "Reminder Ready",
            `Your ${parsed.exerciseName} reminder is ready.`
          );
        }
      } catch (error) {
        console.error("Failed to parse reminder from localStorage:", error);
      }
    }
  }, []);

  // Function to schedule a reminder (call from chat or manually)
  const scheduleExerciseReminder = (exerciseName: string, delayMs = 5 * 1000) => {
    if (typeof window === "undefined") return;

    requestNotificationPermission().catch(() => {
      // Keep reminder flow working even when permission prompt fails.
    });

    const scheduledTime = Date.now() + delayMs;

    const newReminder: ExerciseReminder = {
      id: `reminder-${Date.now()}`,
      exerciseName,
      scheduledTime,
      shown: false,
    };

    // Persist to localStorage
    localStorage.setItem("exerciseReminder", JSON.stringify(newReminder));
    setReminder(newReminder);

    // Inform user via in-app notifications
    addNotification(
      "Exercise Scheduled",
      `Your "${exerciseName}" reminder is scheduled${delayMs < 60_000 ? ` in ${Math.round(delayMs / 1000)}s` : ""}.`,
      "reminder"
    );
  };

  // Clear / dismiss reminder
  const clearReminder = () => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem("exerciseReminder");
      setReminder(null);
      setShowReminderBanner(false);
      addNotification("Reminder dismissed", "You dismissed the exercise reminder.", "system");
    } catch (e) {
      console.error("Failed to clear reminder:", e);
    }
  };

  // Snooze reminder
  const handleSnoozeReminder = (minutes: number) => {
    if (typeof window === "undefined") return;
    const delayMs = minutes * 60 * 1000;
    if (reminder) {
      scheduleExerciseReminder(reminder.exerciseName, delayMs);
      setShowReminderBanner(false);
      addNotification(
        "Reminder Snoozed",
        `Your reminder will appear again in ${minutes} minutes.`,
        "system"
      );
    }
  };

  // Complete reminder
  const handleCompleteReminder = () => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem("exerciseReminder");
      setReminder(null);
      setShowReminderBanner(false);
      addNotification(
        "Great Job!",
        `You completed your ${reminder?.exerciseName || "exercise"}!`,
        "success"
      );
    } catch (e) {
      console.error("Failed to complete reminder:", e);
    }
  };

  // Manual scheduling UI helper (works when chat/api is down)
  const scheduleReminderManually = () => {
    if (typeof window === "undefined") return;
    const name = window.prompt("Enter exercise name (e.g. Breathing Exercise):", "Breathing Exercise");
    if (!name) return;
    const minutesStr = window.prompt("Reminder delay in minutes (use 0.1 for 6s test):", "0.1");
    if (minutesStr === null) return;
    const minutes = Number(minutesStr);
    if (isNaN(minutes) || minutes < 0) return;
    const delayMs = Math.max(0, Math.floor(minutes * 60 * 1000));
    scheduleExerciseReminder(name, delayMs);
  };

  // Fast reminder trigger for UI testing
  const triggerTestReminder = () => {
    scheduleExerciseReminder("Breathing Exercise", 3000);
  };

  // Periodically check if reminder time has elapsed
  useEffect(() => {
    if (!reminder || reminder.shown) return;

    const check = () => {
      const now = Date.now();
      if (now >= reminder.scheduledTime) {
        setShowReminderBanner(true);

        // Send notification to bell icon when time expires
        addNotification(
          "Time for Your Exercise",
          `Complete your ${reminder.exerciseName} exercise now!`,
          "reminder"
        );
        sendBrowserNotification(
          "Time for Your Exercise",
          `Complete your ${reminder.exerciseName} exercise now!`
        );

        // Mark as shown in localStorage
        const updated = { ...reminder, shown: true };
        localStorage.setItem("exerciseReminder", JSON.stringify(updated));
        setReminder(updated);
        return true;
      }
      return false;
    };

    // Immediate check
    if (check()) return;

    const interval = setInterval(() => {
      if (check()) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [reminder]);

  const handleNewSession = async () => {
    try {
      setIsLoading(true);
      const newSessionId = await createChatSession();
      const newSession: ChatSession = {
        sessionId: newSessionId,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setSessions((prev) => [newSession, ...prev]);
      setSessionId(newSessionId);
      setMessages([]);
      window.history.pushState({}, "", `/therapy/${newSessionId}`);
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to create new session:", error);
      setIsLoading(false);
    }
  };

  // Initialize chat session and load history
  useEffect(() => {
    const initChat = async () => {
      try {
        setIsLoading(true);
        if (!sessionId || sessionId === "new") {
          const newSessionId = await createChatSession();
          setSessionId(newSessionId);
          window.history.pushState({}, "", `/therapy/${newSessionId}`);
        } else {
          try {
            const history = await getChatHistory(sessionId);
            if (Array.isArray(history)) {
              const formattedHistory = history.map((msg) => ({
                ...msg,
                timestamp: new Date(msg.timestamp),
              }));
              setMessages(formattedHistory);
            } else {
              setMessages([]);
            }
          } catch (historyError) {
            console.error("Error loading chat history:", historyError);
            setMessages([]);
          }
        }
      } catch (error) {
        console.error("Failed to initialize chat:", error);
        // Fall back to empty state so users can start fresh instead of seeing technical errors.
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    };

    initChat();
  }, [sessionId]);

  // Load all chat sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const allSessions = await getAllChatSessions();
        setSessions(allSessions);
      } catch (error) {
        console.error("Failed to load sessions:", error);
      }
    };

    loadSessions();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  useEffect(() => {
    if (!isTyping) {
      scrollToBottom();
    }
  }, [messages, isTyping]);

  const sendMessageText = async (text: string) => {
    const currentMessage = text.trim();
    if (!currentMessage || isTyping || isChatPaused || !sessionId) return;

    setMessage("");
    setIsTyping(true);

    try {
      const userMessage: ChatMessage = {
        role: "user",
        content: currentMessage,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      const response = await sendChatMessage(sessionId, currentMessage);
      const aiResponse = typeof response === "string" ? JSON.parse(response) : response;

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content:
          aiResponse.response ||
          aiResponse.message ||
          "I'm here to support you. Could you tell me more about what's on your mind?",
        timestamp: new Date(),
        metadata: {
          analysis: aiResponse.analysis || {
            emotionalState: "neutral",
            riskLevel: 0,
            themes: [],
            recommendedApproach: "supportive",
            progressIndicators: [],
          },
          technique: aiResponse.metadata?.technique || "supportive",
          goal: aiResponse.metadata?.currentGoal || "Provide support",
          progress: aiResponse.metadata?.progress || {
            emotionalState: "neutral",
            riskLevel: 0,
          },
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
      scrollToBottom();
    } catch (error) {
      console.error("Error in chat:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I am still here with you. I had a small connection issue, so please try sending that one more time.",
          timestamp: new Date(),
        },
      ]);
      setIsTyping(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessageText(message);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const handleSuggestedQuestion = async (text: string) => {
    let activeSessionId = sessionId;
    if (!activeSessionId) {
      const newSessionId = await createChatSession();
      setSessionId(newSessionId);
      activeSessionId = newSessionId;
      window.history.pushState({}, "", `/therapy/${newSessionId}`);
    }

    if (activeSessionId) {
      setMessage(text);
      setTimeout(() => {
        sendMessageText(text);
      }, 0);
    }
  };

  const handleSessionSelect = async (selectedSessionId: string) => {
    if (selectedSessionId === sessionId) return;

    try {
      setIsLoading(true);
      const history = await getChatHistory(selectedSessionId);
      if (Array.isArray(history)) {
        const formattedHistory = history.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(formattedHistory);
        setSessionId(selectedSessionId);
        window.history.pushState({}, "", `/therapy/${selectedSessionId}`);
      }
    } catch (error) {
      console.error("Failed to load session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative max-w-[1400px] mx-auto px-3 sm:px-4 pb-4">
      {/* Exercise reminder notification - using new enhanced component */}
      <ExerciseReminderNotification
        reminder={reminder}
        isVisible={showReminderBanner}
        onDismiss={clearReminder}
        onSnooze={handleSnoozeReminder}
        onComplete={handleCompleteReminder}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] h-[calc(100vh-5rem)] mt-20 gap-3 sm:gap-4">
        {/* Sidebar with chat history */}
        <aside className="flex flex-col rounded-2xl border border-slate-500/20 bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-700/60">
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Conversation Hub</p>
            <div className="flex items-center justify-between mt-1 mb-2">
              <h2 className="text-lg font-semibold tracking-tight text-slate-100">Sessions</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNewSession}
                className="h-8 w-8 text-slate-200 hover:bg-slate-800"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
              </Button>
            </div>
            <p className="text-xs text-slate-400 mb-3">Start new sessions and revisit prior check-ins.</p>
            <Button
              variant="secondary"
              className="w-full justify-start gap-2 h-10 bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700"
              onClick={handleNewSession}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
              New Session
            </Button>
          </div>

          <ScrollArea className="flex-1 p-3">
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.sessionId}
                  className={cn(
                    "p-3 rounded-xl text-sm cursor-pointer border transition-all duration-200",
                    session.sessionId === sessionId
                      ? "bg-blue-500/20 border-blue-400/40 shadow-sm"
                      : "bg-slate-900/80 border-slate-700/70 hover:border-slate-500 hover:bg-slate-800"
                  )}
                  onClick={() => handleSessionSelect(session.sessionId)}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <MessageSquare className={cn("w-4 h-4", session.sessionId === sessionId ? "text-blue-300" : "text-slate-400")} />
                    <span className="font-medium text-slate-100">{session.messages[0]?.content.slice(0, 30) || "New Chat"}</span>
                  </div>
                  <p className="line-clamp-2 text-xs text-slate-400">
                    {session.messages[session.messages.length - 1]?.content || "No messages yet"}
                  </p>
                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-700/60">
                    <span className="text-xs text-slate-400">{session.messages.length} messages</span>
                    <span className="text-xs text-slate-400">
                      {(() => {
                        try {
                          const date = new Date(session.updatedAt);
                          if (isNaN(date.getTime())) return "Just now";
                          return formatDistanceToNow(date, { addSuffix: true });
                        } catch {
                          return "Just now";
                        }
                      })()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* Main chat area */}
        <section className="flex-1 flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_10px_40px_-18px_rgba(0,0,0,0.45)]">
          {/* Chat header */}
          <div className="p-4 border-b bg-gradient-to-r from-muted/30 via-muted/10 to-transparent flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold tracking-tight">{ASSISTANT_LABEL}</h2>
                <p className="text-xs text-muted-foreground">A calm space to talk freely · {messages.length} messages</p>
              </div>
            </div>

            {/* Manual reminder button (works even if chat/api is down) */}
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" className="h-9 rounded-lg" onClick={triggerTestReminder}>
                Test Reminder
              </Button>
              <Button variant="outline" size="sm" className="h-9 rounded-lg" onClick={scheduleReminderManually}>
                Schedule Reminder
              </Button>
            </div>
          </div>

          {/* Reminder status strip */}
          <div className="px-4 py-2.5 border-b bg-background/70">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">
                Reminder status:
                {" "}
                <span className="font-medium text-foreground">
                  {reminder ? `Scheduled for ${reminder.exerciseName}` : "None"}
                </span>
              </span>
              {reminder && !showReminderBanner && (
                <span className="text-primary font-medium">Waiting to trigger...</span>
              )}
              {showReminderBanner && (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Now visible</span>
              )}
            </div>
          </div>

          {messages.length === 0 ? (
            // Welcome screen with suggested questions
            <div className="flex-1 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_45%)]">
              <div className="max-w-2xl w-full space-y-6 rounded-2xl border border-border/70 bg-card/90 p-6 sm:p-8 shadow-sm">
                <div className="text-center space-y-2">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-semibold tracking-tight">Welcome to your safe chat space</h3>
                  <p className="text-muted-foreground">Talk openly, like you would with a trusted friend.</p>
                </div>

                <div className="grid gap-3">
                  {SUGGESTED_QUESTIONS.map((q, index) => (
                    <motion.div key={q.text} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 + 0.5 }}>
                      <Button variant="outline" className="w-full h-auto py-4 px-5 text-left justify-start rounded-xl hover:bg-muted/60 hover:border-primary/40 transition-colors" onClick={() => handleSuggestedQuestion(q.text)}>
                        {q.text}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Chat messages
            <div className="flex-1 overflow-y-auto scroll-smooth px-4 sm:px-6 py-5 bg-[linear-gradient(to_bottom,rgba(148,163,184,0.06),transparent_180px)]">
              <div className="max-w-4xl mx-auto space-y-4">
                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <motion.div
                      key={(msg.timestamp as Date).toISOString()}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className={cn("flex", msg.role === "assistant" ? "justify-start" : "justify-end")}
                    >
                      <div className={cn("max-w-[85%] sm:max-w-[72%] rounded-2xl border px-4 py-3.5 shadow-sm", msg.role === "assistant" ? "bg-card border-border/70" : "bg-primary text-primary-foreground border-primary/40")}>
                        <div className="flex gap-3">
                          <div className="w-8 h-8 shrink-0 mt-0.5">
                          {msg.role === "assistant" ? (
                            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20">
                              <Bot className="w-5 h-5" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-primary-foreground/20 text-primary-foreground flex items-center justify-center">
                              <User className="w-5 h-5" />
                            </div>
                          )}
                          </div>
                          <div className="flex-1 space-y-2 overflow-hidden min-h-[2rem]">
                            <div className="flex items-center justify-between gap-2">
                              <p className={cn("font-medium text-sm", msg.role === "assistant" ? "text-foreground" : "text-primary-foreground")}>{msg.role === "assistant" ? ASSISTANT_LABEL : "You"}</p>
                              {msg.role === "assistant" && msg.metadata?.technique && (
                                <Badge variant="secondary" className="text-xs">{msg.metadata.technique}</Badge>
                              )}
                            </div>
                            <div className={cn("prose prose-sm dark:prose-invert leading-relaxed max-w-none", msg.role === "user" && "prose-p:text-primary-foreground prose-strong:text-primary-foreground prose-headings:text-primary-foreground") }>
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                            {msg.role === "assistant" && msg.metadata?.goal && (
                              <p className="text-xs text-muted-foreground mt-2">Goal: {msg.metadata.goal}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isTyping && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-[85%] sm:max-w-[72%] rounded-2xl border border-border/70 px-4 py-3.5 bg-card shadow-sm">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 shrink-0">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="font-medium text-sm">{ASSISTANT_LABEL}</p>
                        <p className="text-sm text-muted-foreground">Typing...</p>
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="border-t bg-card p-4">
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-3 items-end relative">
              <div className="flex-1 relative group">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={isChatPaused ? "Complete the activity to continue..." : "Share what is on your mind..."}
                  className={cn(
                    "w-full resize-none rounded-2xl border bg-background",
                    "p-3.5 pr-12 min-h-[52px] max-h-[220px]",
                    "focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40",
                    "transition-all duration-200",
                    "placeholder:text-muted-foreground/70",
                    (isTyping || isChatPaused) && "opacity-50 cursor-not-allowed"
                  )}
                  rows={1}
                  disabled={isTyping || isChatPaused}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                <Button
                  type="submit"
                  size="icon"
                  className={cn(
                    "absolute right-2 bottom-2 h-[36px] w-[36px]",
                    "rounded-xl transition-all duration-200",
                    "bg-primary hover:bg-primary/90 shadow-sm shadow-primary/20",
                    (isTyping || isChatPaused || !message.trim()) && "opacity-50 cursor-not-allowed",
                    "group-hover:scale-105 group-focus-within:scale-105"
                  )}
                  disabled={isTyping || isChatPaused || !message.trim()}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit(e);
                  }}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
            <div className="mt-2 text-xs text-center text-muted-foreground/90">
              Press <kbd className="px-2 py-0.5 rounded bg-muted">Enter ↵</kbd> to send,
              <kbd className="px-2 py-0.5 rounded bg-muted ml-1">Shift + Enter</kbd> for new line
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}