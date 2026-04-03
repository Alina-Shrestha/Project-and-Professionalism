"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CheckCircle,
  X,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface ExerciseReminder {
  id: string;
  exerciseName: string;
  scheduledTime: number;
  shown: boolean;
}

interface ExerciseReminderProps {
  reminder: ExerciseReminder | null;
  isVisible: boolean;
  onDismiss: () => void;
  onSnooze: (minutesDelay: number) => void;
  onComplete: () => void;
}

const SNOOZE_OPTIONS = [
  { label: "5m", minutes: 5 },
  { label: "10m", minutes: 10 },
  { label: "15m", minutes: 15 },
];

export function ExerciseReminderNotification({
  reminder,
  isVisible,
  onDismiss,
  onSnooze,
  onComplete,
}: ExerciseReminderProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Countdown timer effect
  useEffect(() => {
    if (!reminder || !isVisible) return;

    const updateCountdown = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((reminder.scheduledTime - now) / 1000));
      setSecondsRemaining(remaining);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [reminder, isVisible]);

  // Optional sound notification when reminder triggers
  useEffect(() => {
    if (isVisible && soundEnabled && typeof window !== "undefined") {
      // Play a subtle notification sound (using Web Audio API)
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = "sine";

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } catch (error) {
        console.log("Sound notification not available");
      }
    }
  }, [isVisible, soundEnabled]);

  const handleSnooze = (minutes: number) => {
    onSnooze(minutes);
    setShowSnoozeMenu(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!reminder) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.95 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25,
          }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-md w-[calc(100%-2rem)]"
          role="alert"
          aria-live="assertive"
          aria-label={`Exercise reminder: ${reminder.exerciseName}`}
        >
          {/* Gradient background with glassmorphism */}
          <div className="relative overflow-hidden rounded-2xl shadow-2xl">
            {/* Animated gradient background */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 dark:from-blue-600/20 dark:via-purple-600/20 dark:to-pink-600/20"
              animate={{
                backgroundPosition: ["0% 0%", "100% 100%"],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />

            {/* Glassmorphism backdrop */}
            <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl" />

            {/* Border glow effect */}
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              animate={{
                boxShadow: [
                  "inset 0 0 30px rgba(59, 130, 246, 0.1)",
                  "inset 0 0 50px rgba(139, 92, 246, 0.2)",
                  "inset 0 0 30px rgba(59, 130, 246, 0.1)",
                ],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
              }}
            />

            {/* Content */}
            <div className="relative p-4 sm:p-5">
              {/* Header with icon and title */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Animated icon */}
                  <motion.div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20"
                    animate={{
                      scale: [1, 1.05, 1],
                      rotate: [0, 5, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      type: "spring",
                    }}
                  >
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </motion.div>

                  {/* Title and subtitle */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      Time for Your Exercise
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5 truncate">
                      {reminder.exerciseName}
                    </p>
                  </div>
                </div>

                {/* Close button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onDismiss}
                  className="w-8 h-8 rounded-lg bg-slate-200/50 dark:bg-slate-700/50 hover:bg-slate-300/50 dark:hover:bg-slate-600/50 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors flex-shrink-0"
                  aria-label="Dismiss reminder"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Countdown timer */}
              <div className="mb-4 px-3 py-2.5 rounded-lg bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200/30 dark:border-blue-700/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Ready for Action
                  </span>
                </div>
                {secondsRemaining > 0 && (
                  <motion.div
                    className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400 tabular-nums"
                    key={secondsRemaining}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {formatTime(secondsRemaining)}
                  </motion.div>
                )}
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                {/* Primary action: Complete */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onComplete}
                  className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white font-medium text-sm shadow-lg shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Complete
                </motion.button>

                {/* Secondary actions: Snooze + Sound toggle */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Snooze menu */}
                  <div className="relative">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowSnoozeMenu(!showSnoozeMenu)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-200/50 dark:bg-slate-700/50 hover:bg-slate-300/50 dark:hover:bg-slate-600/50 text-slate-900 dark:text-white font-medium text-sm transition-colors"
                    >
                      Snooze
                    </motion.button>

                    {/* Snooze dropdown */}
                    <AnimatePresence>
                      {showSnoozeMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute bottom-full left-0 mb-2 w-32 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200/50 dark:border-slate-700/50 overflow-hidden z-50"
                          role="menu"
                        >
                          {SNOOZE_OPTIONS.map((option) => (
                            <motion.button
                              key={option.minutes}
                              whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                              onClick={() => handleSnooze(option.minutes)}
                              className="w-full px-3 py-2.5 text-sm text-left text-slate-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors font-medium border-b border-slate-100/50 dark:border-slate-700/50 last:border-0"
                              role="menuitem"
                            >
                              Snooze {option.label}
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Sound toggle */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-200/50 dark:bg-slate-700/50 hover:bg-slate-300/50 dark:hover:bg-slate-600/50 text-slate-900 dark:text-white font-medium text-sm transition-colors flex items-center justify-center gap-1.5"
                    aria-label={soundEnabled ? "Disable sound" : "Enable sound"}
                  >
                    {soundEnabled ? (
                      <Volume2 className="w-4 h-4" />
                    ) : (
                      <VolumeX className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">Sound</span>
                  </motion.button>
                </div>
              </div>

              {/* Status badge */}
              <motion.div
                className="mt-3 flex items-center justify-between"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Badge
                  variant="secondary"
                  className="text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-700/50"
                >
                  🎯 Ready to Start
                </Badge>

                {soundEnabled && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Sound is on
                  </span>
                )}
              </motion.div>
            </div>

            {/* Progress indicator line */}
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 dark:from-blue-600 dark:via-purple-600 dark:to-pink-600"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              style={{ transformOrigin: "left" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
