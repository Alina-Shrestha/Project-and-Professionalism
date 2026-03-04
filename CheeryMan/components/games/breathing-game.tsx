"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Feather, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

const TOTAL_ROUNDS = 5;

export function BreathingGame() {
  const [phase, setPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [progress, setProgress] = useState(0);
  const [round, setRound] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isComplete || isPaused) return;

    let timer: NodeJS.Timeout;

    if (phase === "inhale") {
      timer = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            setPhase("hold");
            return 0;
          }
          return p + 2;
        });
      }, 100);
    } else if (phase === "hold") {
      timer = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            setPhase("exhale");
            return 0;
          }
          return p + 4;
        });
      }, 100);
    } else {
      timer = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            if (round >= TOTAL_ROUNDS) {
              setIsComplete(true);
              return p;
            }
            setPhase("inhale");
            setRound((r) => r + 1);
            return 0;
          }
          return p + 2;
        });
      }, 100);
    }

    return () => clearInterval(timer);
  }, [phase, round, isComplete, isPaused]);

  const handleReset = () => {
    setPhase("inhale");
    setProgress(0);
    setRound(1);
    setIsComplete(false);
    setIsPaused(false);
  };

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] space-y-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 rounded-full bg-green-200/30 flex items-center justify-center"
        >
          <Check className="w-12 h-12 text-green-500" />
        </motion.div>
        <h3 className="text-2xl font-semibold text-gray-800">Well done!</h3>
        <p className="text-gray-600 text-center max-w-sm">
          You've completed {TOTAL_ROUNDS} rounds of mindful breathing. Feel the calm.
        </p>
        <Button onClick={handleReset} className="mt-4">
          Start Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-[450px] space-y-8 bg-gradient-to-b from-purple-50 via-blue-50 to-green-50 rounded-2xl p-6 shadow-lg">
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="text-center space-y-4"
        >
          <div className="relative w-36 h-36 mx-auto">
            {/* Pulsating Circle */}
            <motion.div
              animate={{
                scale: phase === "inhale" ? 1.4 : phase === "exhale" ? 0.9 : 1.1,
              }}
              transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
              className="absolute inset-0 bg-gradient-to-tr from-blue-200 via-purple-200 to-pink-200 rounded-full opacity-40"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Feather className="w-12 h-12 text-purple-600" />
            </div>
          </div>
          <h3 className="text-2xl font-semibold text-purple-700">
            {phase === "inhale"
              ? "Breathe In"
              : phase === "hold"
              ? "Hold"
              : "Breathe Out"}
          </h3>
        </motion.div>
      </AnimatePresence>

      <div className="w-64">
        <Progress value={progress} className="h-3 rounded-full bg-purple-100" />
      </div>

      <div className="space-y-2 text-center">
        <div className="text-sm text-gray-500">
          Round {round} of {TOTAL_ROUNDS}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsPaused(!isPaused)}
        >
          {isPaused ? "Resume" : "Pause"}
        </Button>
      </div>
    </div>
  );
}