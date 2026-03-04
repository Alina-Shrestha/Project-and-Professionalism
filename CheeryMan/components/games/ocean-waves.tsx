"use client";

import { useState, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";

const BREATH_DURATION = 8; // seconds
const SESSION_DURATION = 5 * 60;

export function OceanWaves() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(SESSION_DURATION);
  const waveControls = useAnimation();
  const [audio] = useState(new Audio("/sounds/waves.mp3"));

  useEffect(() => {
    audio.loop = true;
    audio.volume = volume / 100;
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  useEffect(() => {
    audio.volume = volume / 100;
  }, [volume]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          setProgress(((SESSION_DURATION - newTime) / SESSION_DURATION) * 100);
          return newTime;
        });
      }, 1000);

      waveControls.start({
        scale: [1, 1.1, 1],
        transition: { duration: BREATH_DURATION, repeat: Infinity, ease: "easeInOut" },
      });
    } else {
      waveControls.stop();
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft]);

  const togglePlay = () => {
    if (isPlaying) audio.pause();
    else audio.play();
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center justify-center w-[360px] min-h-[400px] bg-gradient-to-b from-teal-50 to-blue-50 rounded-2xl shadow-xl p-6 mx-auto">
      
      {/* Calm Ocean-Lotus Breathing Circle */}
      <motion.div
        animate={waveControls}
        className="relative w-36 h-36 flex items-center justify-center rounded-full bg-gradient-to-br from-teal-200 to-blue-200 shadow-lg"
      >
        {/* Expanding pulse behind icon */}
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: BREATH_DURATION, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full bg-gradient-to-br from-teal-100 to-blue-100"
        />

        {/* Lotus / Calm Wave Icon */}
        <svg
          className="w-24 h-24 text-blue-600 relative z-10"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M32 2C18 18 12 32 32 62C52 32 46 18 32 2Z"
            stroke="#1D4ED8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="url(#grad)"
          />
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="0" y2="64" gradientUnits="userSpaceOnUse">
              <stop stopColor="#60A5FA" />
              <stop offset="1" stopColor="#22D3EE" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Controls */}
      <div className="mt-6 w-full space-y-5">
        {/* Volume */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Volume</span>
            <span>{volume}%</span>
          </div>
          <div className="flex items-center gap-2">
            {volume === 0 ? <VolumeX className="w-5 h-5 text-teal-400" /> : <Volume2 className="w-5 h-5 text-blue-500" />}
            <Slider value={[volume]} onValueChange={(v) => setVolume(v[0])} max={100} step={1} />
          </div>
        </div>

        {/* Progress */}
        <Progress value={progress} className="h-2 rounded-full bg-blue-100" />

        {/* Timer & Play */}
        <div className="flex items-center justify-between text-gray-600">
          <span className="text-sm">{formatTime(timeLeft)}</span>
          <Button variant="outline" size="icon" className="rounded-full" onClick={togglePlay}>
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
          <span className="text-sm">{formatTime(SESSION_DURATION)}</span>
        </div>
      </div>
    </div>
  );
}