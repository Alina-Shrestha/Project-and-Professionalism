"use client";

import { useEffect } from "react";
import {
  addNotification,
  sendBrowserNotification,
} from "@/lib/notifications/notification.service";

type ExerciseReminder = {
  id: string;
  exerciseName: string;
  scheduledTime: number;
  shown: boolean;
};

const REMINDER_STORAGE_KEY = "exerciseReminder";

export function ReminderWatcher() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkDueReminder = () => {
      const stored = localStorage.getItem(REMINDER_STORAGE_KEY);
      if (!stored) return;

      try {
        const reminder: ExerciseReminder = JSON.parse(stored);
        if (!reminder || reminder.shown) return;

        if (Date.now() >= reminder.scheduledTime) {
          const updated = { ...reminder, shown: true };
          localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(updated));

          const title = "Time for Your Exercise";
          const message = `Complete your ${reminder.exerciseName} exercise now!`;

          addNotification(title, message, "reminder");
          sendBrowserNotification(title, message);
        }
      } catch (error) {
        console.error("Failed to parse reminder in global watcher:", error);
      }
    };

    // Run once on mount and then poll across routes.
    checkDueReminder();
    const interval = window.setInterval(checkDueReminder, 1000);

    // Also re-check when tab becomes active again.
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkDueReminder();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return null;
}
