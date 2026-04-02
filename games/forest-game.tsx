"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Leaf, Volume2, VolumeX, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";

const MEDITATION_DURATION = 5 * 60;

export function ForestGame() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(45);
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MEDITATION_DURATION);

  const [audioElements] = useState({
    birds: new Audio("/sounds/birds.mp3"),
    wind: new Audio("/sounds/wind.mp3"),
    leaves: new Audio("/sounds/leaves.mp3"),
  });

  // Audio setup
  useEffect(() => {
    Object.values(audioElements).forEach((audio) => {
      audio.loop = true;
      audio.volume = volume / 100;
    });

    return () => {
      Object.values(audioElements).forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
    };
  }, []);

  useEffect(() => {
    Object.values(audioElements).forEach((audio) => {
      audio.volume = volume / 100;
    });
  }, [volume]);

  // Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          setProgress(
            ((MEDITATION_DURATION - newTime) / MEDITATION_DURATION) * 100
          );
          return newTime;
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [isPlaying, timeLeft]);

  const togglePlay = () => {
    if (isPlaying) {
      Object.values(audioElements).forEach((audio) => audio.pause());
    } else {
      Object.values(audioElements).forEach((audio) => audio.play());
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center justify-center min-h-[600px] bg-slate-100 p-8">
      <div className="relative w-full max-w-md">

        {/* Ambient Background Aura */}
        <motion.div
          animate={{
            scale: isPlaying ? [1, 1.08, 1] : 1,
            opacity: isPlaying ? [0.4, 0.6, 0.4] : 0.3,
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -inset-10 rounded-[40px] bg-gradient-to-br from-emerald-200 via-blue-200 to-indigo-200 blur-3xl"
        />

        {/* Glass Card */}
        <div className="relative bg-white/60 backdrop-blur-2xl shadow-2xl rounded-[32px] px-10 py-12 space-y-10 text-center border border-white/40">

          {/* Meditation Symbol */}
          <motion.div
            animate={{
              scale: isPlaying ? [1, 1.05, 1] : 1,
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="flex justify-center"
          >
            <Leaf className="w-20 h-20 text-emerald-700" strokeWidth={1.5} />
          </motion.div>

          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">
              Forest Meditation
            </h2>
            <p className="text-sm text-slate-500">
              Ground yourself. Slow down. Just be present.
            </p>
          </div>

          {/* Timer */}
          <div className="space-y-4">
            <div className="text-4xl font-light text-slate-800 tracking-widest">
              {formatTime(timeLeft)}
            </div>

            <Progress
              value={progress}
              className="h-[3px] bg-slate-200"
            />
          </div>

          {/* Controls */}
          <div className="space-y-8">

            {/* Play Button */}
            <Button
              onClick={togglePlay}
              className="rounded-full w-16 h-16 mx-auto bg-slate-900 text-white hover:bg-slate-800 transition-all duration-300 shadow-lg"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" strokeWidth={2} />
              ) : (
                <Play className="w-5 h-5 ml-0.5" strokeWidth={2} />
              )}
            </Button>

            {/* Volume */}
            <div className="space-y-3 text-left">
              <div className="flex justify-between text-xs text-slate-500 uppercase tracking-wide">
                <span>Ambient Volume</span>
                <span>{volume}%</span>
              </div>

              <div className="flex items-center gap-3">
                {volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-slate-400" />
                )}

                <Slider
                  value={[volume]}
                  onValueChange={(value) => setVolume(value[0])}
                  max={100}
                  step={1}
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}