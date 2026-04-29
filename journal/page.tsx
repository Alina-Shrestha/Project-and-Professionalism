"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "@/lib/contexts/session-context";
import { useRouter } from "next/navigation";

interface Entry {
  _id: string;
  title: string;
  content: string;
  moodScore?: number;
  createdAt: string;
}

export default function JournalPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated, loading: sessionLoading } = useSession();
  const router = useRouter();

  const loadEntries = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await fetch("/api/journal", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      return;
    }

    const data = await res.json();
    setEntries(Array.isArray(data?.data) ? data.data : []);
  };

  useEffect(() => {
    if (!sessionLoading && !isAuthenticated) {
      toast({
        title: "Login required",
        description: "Please login to use journal.",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }

    if (!sessionLoading && isAuthenticated) {
      loadEntries();
    }
  }, [sessionLoading, isAuthenticated]);

  const saveEntry = async () => {
    if (!title.trim() || !content.trim()) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Login required",
        description: "Please login to save journal entries.",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/journal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, content }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast({
        title: "Save failed",
        description: err?.error || err?.message || "Could not save journal entry.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setTitle("");
    setContent("");
    setLoading(false);
    toast({ title: "Saved", description: "Journal entry saved." });
    loadEntries();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-24 pb-10 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Journal</h1>
        <p className="text-sm text-muted-foreground">
          Write freely and keep track of your thoughts over time.
        </p>
      </div>

      <div className="rounded-2xl border bg-card p-5 space-y-3 shadow-sm">
        <Input
          placeholder="Entry title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Textarea
          placeholder="Write your thoughts here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
        />
        <Button className="w-full sm:w-auto" onClick={saveEntry} disabled={loading}>
          {loading ? "Saving..." : "Save Journal Entry"}
        </Button>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Recent Entries</h2>
        {entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            No journal entries yet. Write your first note above.
          </div>
        ) : (
          entries.map((entry) => (
            <div key={entry._id} className="rounded-2xl border bg-card p-4 shadow-sm">
              <p className="font-semibold">{entry.title}</p>
              <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line break-words">
                {entry.content}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(entry.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
