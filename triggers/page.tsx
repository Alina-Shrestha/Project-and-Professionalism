"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "@/lib/contexts/session-context";
import { useRouter } from "next/navigation";

interface TriggerItem {
  _id: string;
  situation: string;
  thought: string;
  reaction: string;
  intensity: number;
  createdAt: string;
}

export default function TriggersPage() {
  const [situation, setSituation] = useState("");
  const [thought, setThought] = useState("");
  const [reaction, setReaction] = useState("");
  const [intensity, setIntensity] = useState(5);
  const [items, setItems] = useState<TriggerItem[]>([]);
  const { toast } = useToast();
  const { isAuthenticated, loading: sessionLoading } = useSession();
  const router = useRouter();

  const loadItems = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await fetch("/api/triggers", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      return;
    }

    const data = await res.json();
    setItems(Array.isArray(data?.data) ? data.data : []);
  };

  useEffect(() => {
    if (!sessionLoading && !isAuthenticated) {
      toast({
        title: "Login required",
        description: "Please login to use trigger log.",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }

    if (!sessionLoading && isAuthenticated) {
      loadItems();
    }
  }, [sessionLoading, isAuthenticated]);

  const save = async () => {
    if (!situation.trim() || !thought.trim() || !reaction.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill situation, thought, and reaction.",
        variant: "destructive",
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Login required",
        description: "Please login to save trigger logs.",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }

    const res = await fetch("/api/triggers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ situation, thought, reaction, intensity }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast({
        title: "Save failed",
        description: err?.error || err?.message || "Could not save trigger log.",
        variant: "destructive",
      });
      return;
    }

    setSituation("");
    setThought("");
    setReaction("");
    setIntensity(5);
    toast({ title: "Saved", description: "Trigger log saved." });
    loadItems();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-24 pb-10 space-y-6">
      <h1 className="text-3xl font-bold">Trigger Log</h1>

      <div className="rounded-xl border p-4 space-y-3">
        <Input placeholder="Situation" value={situation} onChange={(e) => setSituation(e.target.value)} />
        <Textarea placeholder="Thought" value={thought} onChange={(e) => setThought(e.target.value)} rows={3} />
        <Textarea placeholder="Reaction" value={reaction} onChange={(e) => setReaction(e.target.value)} rows={3} />
        <div className="space-y-2">
          <p className="text-sm font-medium">Intensity: {intensity}/10</p>
          <Slider value={[intensity]} onValueChange={(v) => setIntensity(v[0])} min={1} max={10} step={1} />
        </div>
        <Button onClick={save}>Save Trigger</Button>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item._id} className="rounded-xl border p-4 space-y-1">
            <p><span className="font-medium">Situation:</span> {item.situation}</p>
            <p><span className="font-medium">Thought:</span> {item.thought}</p>
            <p><span className="font-medium">Reaction:</span> {item.reaction}</p>
            <p className="text-sm text-muted-foreground">Intensity: {item.intensity}/10</p>
          </div>
        ))}
      </div>
    </div>
  );
}
