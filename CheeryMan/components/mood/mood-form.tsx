"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "@/lib/contexts/session-context";
import { useRouter } from "next/navigation";

interface MoodFormProps {
  onSuccess?: () => void;
}

export function MoodForm({ onSuccess }: MoodFormProps) {
  const [moodScore, setMoodScore] = useState(50);
  const [energy, setEnergy] = useState(3);
  const [stress, setStress] = useState(3);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, isAuthenticated, loading } = useSession();
  const router = useRouter();

  const tagOptions = ["sleep", "work", "family", "social", "health"];

  const emotions = [
    { value: 0, description: "Very Low", color: "bg-rose-500" },
    { value: 25, description: "Low", color: "bg-orange-500" },
    { value: 50, description: "Neutral", color: "bg-amber-500" },
    { value: 75, description: "Good", color: "bg-lime-500" },
    { value: 100, description: "Great", color: "bg-emerald-500" },
  ];

  const currentEmotion =
    emotions.find((em) => Math.abs(moodScore - em.value) < 15) || emotions[2];

  const handleSubmit = async () => {
    console.log("MoodForm: Starting submission");
    console.log("MoodForm: Auth state:", { isAuthenticated, loading, user });

    if (!isAuthenticated) {
      console.log("MoodForm: User not authenticated");
      toast({
        title: "Authentication required",
        description: "Please log in to track your mood",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      console.log(
        "MoodForm: Token from localStorage:",
        token ? "exists" : "not found"
      );

      const response = await fetch("/api/mood", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          score: moodScore,
          energy,
          stress,
          tags: selectedTags,
        }),
      });

      console.log("MoodForm: Response status:", response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error("MoodForm: Error response:", error);
        throw new Error(error.error || "Failed to track mood");
      }

      const data = await response.json();
      console.log("MoodForm: Success response:", data);

      toast({
        title: "Mood tracked successfully!",
        description: "Your mood has been recorded.",
      });

      // Call onSuccess to close the modal
      onSuccess?.();
    } catch (error) {
      console.error("MoodForm: Error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to track mood",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      {/* Emotion display */}
      <div className="text-center space-y-2">
        <div className="mx-auto h-10 w-10 rounded-full border border-border bg-muted flex items-center justify-center">
          <div className={`h-4 w-4 rounded-full ${currentEmotion.color}`} />
        </div>
        <div className="text-sm font-medium">
          {currentEmotion.description}
        </div>
      </div>

      {/* Emotion slider */}
      <div className="space-y-4">
        <div className="grid grid-cols-5 gap-2">
          {emotions.map((em) => (
            <button
              key={em.value}
              type="button"
              className={`cursor-pointer transition-all rounded-md border px-2 py-2 text-xs ${
                Math.abs(moodScore - em.value) < 15
                  ? "opacity-100 border-primary bg-primary/10"
                  : "opacity-80 border-border hover:bg-muted"
              }`}
              onClick={() => setMoodScore(em.value)}
            >
              <div className="flex flex-col items-center gap-1">
                <div className={`h-2.5 w-2.5 rounded-full ${em.color}`} />
                <div>{em.description}</div>
              </div>
            </button>
          ))}
        </div>

        <Slider
          value={[moodScore]}
          onValueChange={(value) => setMoodScore(value[0])}
          min={0}
          max={100}
          step={1}
          className="py-4"
        />
      </div>

      {/* Simple analysis-friendly inputs */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm font-medium">Energy: {energy}/5</div>
          <Slider
            value={[energy]}
            onValueChange={(value) => setEnergy(value[0])}
            min={1}
            max={5}
            step={1}
          />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Stress: {stress}/5</div>
          <Slider
            value={[stress]}
            onValueChange={(value) => setStress(value[0])}
            min={1}
            max={5}
            step={1}
          />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">What affected your mood?</div>
          <div className="flex flex-wrap gap-2">
            {tagOptions.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  className={`px-3 py-1.5 rounded-md border text-sm transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:bg-muted"
                  }`}
                  onClick={() => {
                    setSelectedTags((prev) =>
                      prev.includes(tag)
                        ? prev.filter((t) => t !== tag)
                        : [...prev, tag]
                    );
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Submit button */}
      <Button
        className="w-full"
        onClick={handleSubmit}
        disabled={isLoading || loading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : loading ? (
          "Loading..."
        ) : (
          "Save Mood"
        )}
      </Button>
    </div>
  );
}
