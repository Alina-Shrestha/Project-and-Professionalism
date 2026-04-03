"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Calendar,
  Activity,
  Sun,
  Moon,
  Heart,
  Trophy,
  Bell,
  Sparkles,
  MessageSquare,
  BrainCircuit,
  ArrowRight,
  X,
  Loader2,
  Flame,
  Zap,
  Leaf,
  CheckCircle2,
  Smile,
  Wind,
  Rocket,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";
import { MoodForm } from "@/components/mood/mood-form";
import { AnxietyGames } from "@/components/games/anxiety-games";

import { getUserActivities, logActivity } from "@/lib/static-dashboard-data";
import { getMoodHistory, getMoodStats } from "@/lib/api/mood";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import {
  addDays,
  format,
  subDays,
  startOfDay,
  isWithinInterval,
} from "date-fns";
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
} from "recharts";

import { ActivityLogger } from "@/components/activities/activity-logger";
import { OnboardingModal } from "@/components/onboarding/onboarding-modal";
import { useSession } from "@/lib/contexts/session-context";
import { getAllChatSessions } from "@/lib/api/chat";

// Add this type definition
type ActivityLevel = "none" | "low" | "medium" | "high";

interface DayActivity {
  date: Date;
  level: ActivityLevel;
  activities: {
    type: string;
    name: string;
    completed: boolean;
    time?: string;
  }[];
}

// Add this interface near the top with other interfaces
interface Activity {
  id: string;
  userId: string | null;
  type: string;
  name: string;
  description: string | null;
  timestamp: Date;
  duration: number | null;
  completed: boolean;
  moodScore: number | null;
  moodNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Add this interface for stats
interface DailyStats {
  moodScore: number | null;
  completionRate: number;
  mindfulnessCount: number;
  totalActivities: number;
  lastUpdated: Date;
}

interface MoodHistoryEntry {
  _id: string;
  score: number;
  note?: string;
  createdAt?: string;
  timestamp?: string;
}

// Update the calculateDailyStats function to show correct stats
const calculateDailyStats = (activities: Activity[]): DailyStats => {
  const today = startOfDay(new Date());
  const todaysActivities = activities.filter((activity) =>
    isWithinInterval(new Date(activity.timestamp), {
      start: today,
      end: addDays(today, 1),
    })
  );

  // Calculate mood score (average of today's mood entries)
  const moodEntries = todaysActivities.filter(
    (a) => a.type === "mood" && a.moodScore !== null
  );
  const averageMood =
    moodEntries.length > 0
      ? Math.round(
          moodEntries.reduce((acc, curr) => acc + (curr.moodScore || 0), 0) /
            moodEntries.length
        )
      : null;

  // Count therapy sessions (all sessions ever)
  const therapySessions = activities.filter((a) => a.type === "therapy").length;

  return {
    moodScore: averageMood,
    completionRate: 100, // Always 100% as requested
    mindfulnessCount: therapySessions, // Total number of therapy sessions
    totalActivities: todaysActivities.length,
    lastUpdated: new Date(),
  };
};

// Rename the function
const generateInsights = (activities: Activity[]) => {
  const insights: {
    title: string;
    description: string;
    icon: any;
    priority: "low" | "medium" | "high";
  }[] = [];

  // Get activities from last 7 days
  const lastWeek = subDays(new Date(), 7);
  const recentActivities = activities.filter(
    (a) => new Date(a.timestamp) >= lastWeek
  );

  // Analyze mood patterns
  const moodEntries = recentActivities.filter(
    (a) => a.type === "mood" && a.moodScore !== null
  );
  if (moodEntries.length >= 2) {
    const averageMood =
      moodEntries.reduce((acc, curr) => acc + (curr.moodScore || 0), 0) /
      moodEntries.length;
    const latestMood = moodEntries[moodEntries.length - 1].moodScore || 0;

    if (latestMood > averageMood) {
      insights.push({
        title: "Mood Improvement",
        description:
          "Your recent mood scores are above your weekly average. Keep up the good work!",
        icon: Brain,
        priority: "high",
      });
    } else if (latestMood < averageMood - 20) {
      insights.push({
        title: "Mood Change Detected",
        description:
          "I've noticed a dip in your mood. Would you like to try some mood-lifting activities?",
        icon: Heart,
        priority: "high",
      });
    }
  }

  // Analyze activity patterns
  const mindfulnessActivities = recentActivities.filter((a) =>
    ["game", "meditation", "breathing"].includes(a.type)
  );
  if (mindfulnessActivities.length > 0) {
    const dailyAverage = mindfulnessActivities.length / 7;
    if (dailyAverage >= 1) {
      insights.push({
        title: "Consistent Practice",
        description: `You've been regularly engaging in mindfulness activities. This can help reduce stress and improve focus.`,
        icon: Trophy,
        priority: "medium",
      });
    } else {
      insights.push({
        title: "Mindfulness Opportunity",
        description:
          "Try incorporating more mindfulness activities into your daily routine.",
        icon: Sparkles,
        priority: "low",
      });
    }
  }

  // Check activity completion rate
  const completedActivities = recentActivities.filter((a) => a.completed);
  const completionRate =
    recentActivities.length > 0
      ? (completedActivities.length / recentActivities.length) * 100
      : 0;

  if (completionRate >= 80) {
    insights.push({
      title: "High Achievement",
      description: `You've completed ${Math.round(
        completionRate
      )}% of your activities this week. Excellent commitment!`,
      icon: Trophy,
      priority: "high",
    });
  } else if (completionRate < 50) {
    insights.push({
      title: "Activity Reminder",
      description:
        "You might benefit from setting smaller, more achievable daily goals.",
      icon: Calendar,
      priority: "medium",
    });
  }

  // Time pattern analysis
  const morningActivities = recentActivities.filter(
    (a) => new Date(a.timestamp).getHours() < 12
  );
  const eveningActivities = recentActivities.filter(
    (a) => new Date(a.timestamp).getHours() >= 18
  );

  if (morningActivities.length > eveningActivities.length) {
    insights.push({
      title: "Morning Person",
      description:
        "You're most active in the mornings. Consider scheduling important tasks during your peak hours.",
      icon: Sun,
      priority: "medium",
    });
  } else if (eveningActivities.length > morningActivities.length) {
    insights.push({
      title: "Evening Routine",
      description:
        "You tend to be more active in the evenings. Make sure to wind down before bedtime.",
      icon: Moon,
      priority: "medium",
    });
  }

  // Sort insights by priority and return top 3
  return insights
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 3);
};

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();

  // Rename the state variable
  const [insights, setInsights] = useState<
    {
      title: string;
      description: string;
      icon: any;
      priority: "low" | "medium" | "high";
    }[]
  >([]);

  // New states for activities and wearables
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [showCheckInChat, setShowCheckInChat] = useState(false);
  const [activityHistory, setActivityHistory] = useState<DayActivity[]>([]);
  const [showActivityLogger, setShowActivityLogger] = useState(false);
  const [isSavingActivity, setIsSavingActivity] = useState(false);
  const [moodHistory, setMoodHistory] = useState<MoodHistoryEntry[]>([]);
  const [isRefreshingStats, setIsRefreshingStats] = useState(false);
  const [onboardingModalTrigger, setOnboardingModalTrigger] = useState(0);
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    moodScore: null,
    completionRate: 0,
    mindfulnessCount: 0,
    totalActivities: 0,
    lastUpdated: new Date(),
  });

  // Add this function to transform activities into day activity format
  const transformActivitiesToDayActivity = (
    activities: Activity[]
  ): DayActivity[] => {
    const days: DayActivity[] = [];
    const today = new Date();

    // Create array for last 28 days
    for (let i = 27; i >= 0; i--) {
      const date = startOfDay(subDays(today, i));
      const dayActivities = activities.filter((activity) =>
        isWithinInterval(new Date(activity.timestamp), {
          start: date,
          end: addDays(date, 1),
        })
      );

      // Determine activity level based on number of activities
      let level: ActivityLevel = "none";
      if (dayActivities.length > 0) {
        if (dayActivities.length <= 2) level = "low";
        else if (dayActivities.length <= 4) level = "medium";
        else level = "high";
      }

      days.push({
        date,
        level,
        activities: dayActivities.map((activity) => ({
          type: activity.type,
          name: activity.name,
          completed: activity.completed,
          time: format(new Date(activity.timestamp), "h:mm a"),
        })),
      });
    }

    return days;
  };

  const moodTrendData = useMemo(() => {
    return moodHistory
      .map((entry) => ({
        score: entry.score,
        recordedAt: entry.createdAt || entry.timestamp,
      }))
      .filter((entry): entry is { score: number; recordedAt: string } =>
        Boolean(entry.recordedAt)
      )
      .sort(
        (a, b) =>
          new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
      )
      .map((entry) => ({
        score: entry.score,
        timestamp: new Date(entry.recordedAt).getTime(),
      }));
  }, [moodHistory]);

  // Modify the loadActivities function to use a default user ID
  const loadActivities = useCallback(async () => {
    try {
      const userActivities = await getUserActivities("default-user");
      setActivities(userActivities);
      setActivityHistory(transformActivitiesToDayActivity(userActivities));
    } catch (error) {
      console.error("Error loading activities:", error);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!sessionLoading) {
      if (!user) {
        router.replace("/login");
      }
    }
  }, [sessionLoading, user, router]);

  // Add this effect to update stats when activities change
  useEffect(() => {
    if (activities.length > 0) {
      setDailyStats(calculateDailyStats(activities));
    }
  }, [activities]);

  // Update the effect
  useEffect(() => {
    if (activities.length > 0) {
      setInsights(generateInsights(activities));
    }
  }, [activities]);

  // Add function to save wellness snapshot for analysis
  const saveWellnessSnapshot = useCallback(async (moodScore: number | null, completionRate: number, totalActivities: number) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) return;

      await fetch("/api/wellness/snapshot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          moodScore: moodScore || 0,
          completionRate,
          totalActivities,
        }),
      });
    } catch (error) {
      console.error("Error saving snapshot:", error);
    }
  }, []);

  // Add function to fetch daily stats
  const fetchDailyStats = useCallback(async () => {
    try {
      setIsRefreshingStats(true);

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const authHeaders: Record<string, string> = {};
      if (token) authHeaders.Authorization = `Bearer ${token}`;

      const [sessionsResult, moodStatsResult, moodHistoryResult, journalResult, triggerResult, erpResult] = await Promise.allSettled([
        getAllChatSessions(),
        getMoodStats("week"),
        getMoodHistory({ limit: 7 }),
        fetch("/api/journal", { headers: authHeaders }).then((res) => res.json()),
        fetch("/api/triggers", { headers: authHeaders }).then((res) => res.json()),
        fetch("/api/erp", { headers: authHeaders }).then((res) => res.json()),
      ]);

      const sessions =
        sessionsResult.status === "fulfilled" && Array.isArray(sessionsResult.value)
          ? sessionsResult.value
          : [];

      const moodStatsResponse =
        moodStatsResult.status === "fulfilled"
          ? moodStatsResult.value
          : {
              data: { average: 0, count: 0, highest: 0, lowest: 0, history: [] },
            };

      const moodHistoryResponse =
        moodHistoryResult.status === "fulfilled"
          ? moodHistoryResult.value
          : { data: [] };

      const journalEntries =
        journalResult.status === "fulfilled" && Array.isArray(journalResult.value?.data)
          ? journalResult.value.data
          : [];

      const triggerLogs =
        triggerResult.status === "fulfilled" && Array.isArray(triggerResult.value?.data)
          ? triggerResult.value.data
          : [];

      const erpRecords =
        erpResult.status === "fulfilled" && Array.isArray(erpResult.value?.data?.records)
          ? erpResult.value.data.records
          : [];

      const todayStart = startOfDay(new Date());
      const todayEnd = addDays(todayStart, 1);

      const isToday = (value?: string | Date) => {
        if (!value) return false;
        const date = new Date(value);
        if (isNaN(date.getTime())) return false;
        return isWithinInterval(date, { start: todayStart, end: todayEnd });
      };

      const moodEntriesToday = (Array.isArray(moodHistoryResponse.data) ? moodHistoryResponse.data : []).filter(
        (entry: any) => isToday(entry.createdAt || entry.timestamp)
      );

      const journalToday = journalEntries.filter((entry: any) => isToday(entry.createdAt));
      const triggersToday = triggerLogs.filter((entry: any) => isToday(entry.createdAt));
      const erpToday = erpRecords.filter((entry: any) => isToday(entry.createdAt));
      const sessionsToday = sessions.filter((entry: any) => isToday(entry.updatedAt || entry.createdAt));

      const moodAverageToday =
        moodEntriesToday.length > 0
          ? Math.round(
              moodEntriesToday.reduce((sum: number, entry: any) => sum + (entry.score || 0), 0) /
                moodEntriesToday.length
            )
          : null;

      const completionChecks = [
        moodEntriesToday.length > 0,
        journalToday.length > 0,
        erpToday.length > 0,
      ];
      const completionRate = Math.round(
        (completionChecks.filter(Boolean).length / completionChecks.length) * 100
      );

      const averageMood =
        moodStatsResponse.data.count > 0
          ? Math.round(moodStatsResponse.data.average)
          : null;

      const totalActivitiesCount =
        moodEntriesToday.length +
        journalToday.length +
        triggersToday.length +
        erpToday.length +
        sessionsToday.length;

      setDailyStats({
        moodScore: moodAverageToday ?? averageMood,
        completionRate,
        mindfulnessCount: sessions.length,
        totalActivities: totalActivitiesCount,
        lastUpdated: new Date(),
      });

      // Save wellness snapshot for historical analysis
      await saveWellnessSnapshot(moodAverageToday ?? averageMood, completionRate, totalActivitiesCount);

      setMoodHistory(Array.isArray(moodHistoryResponse.data) ? moodHistoryResponse.data : []);
    } catch (error) {
      console.error("Error fetching daily stats:", error);
    } finally {
      setIsRefreshingStats(false);
    }
  }, [saveWellnessSnapshot]);

  // Fetch stats on mount and every 5 minutes
  useEffect(() => {
    fetchDailyStats();
    const interval = setInterval(fetchDailyStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchDailyStats]);

  // Update wellness stats to reflect the changes
  const wellnessStats = [
    {
      title: "Emotional Well-being",
      value:
        dailyStats.moodScore !== null ? `${dailyStats.moodScore}%` : "—",
      icon: Smile,
      color: "text-rose-500",
      bgColor: "bg-gradient-to-br from-rose-500/20 to-pink-500/10",
      description: "Your emotional state today",
      borderColor: "border-rose-500/30",
    },
    {
      title: "Wellness Journey",
      value: `${dailyStats.completionRate}%`,
      icon: Flame,
      color: "text-amber-500",
      bgColor: "bg-gradient-to-br from-amber-500/20 to-orange-500/10",
      description: "Keep the momentum going!",
      borderColor: "border-amber-500/30",
    },
    {
      title: "Mindful Moments",
      value: `${dailyStats.mindfulnessCount}`,
      icon: Leaf,
      color: "text-emerald-500",
      bgColor: "bg-gradient-to-br from-emerald-500/20 to-teal-500/10",
      description: "Sessions completed",
      borderColor: "border-emerald-500/30",
    },
    {
      title: "Actions Taken",
      value: dailyStats.totalActivities.toString(),
      icon: Zap,
      color: "text-violet-500",
      bgColor: "bg-gradient-to-br from-violet-500/20 to-purple-500/10",
      description: "Steps towards wellness",
      borderColor: "border-violet-500/30",
    },
  ];

  // Load activities on mount
  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  // Add these action handlers
  const handleStartTherapy = () => {
    router.push("/therapy/new");
  };

  const handleAICheckIn = () => {
    setShowActivityLogger(true);
  };

  const handleCompleteOnboarding = () => {
    setOnboardingModalTrigger((value) => value + 1);
  };

  const handleViewTherapists = () => {
    router.push("/therapists");
  };

  const handleDownloadProgressSummary = () => {
    const summaryLines = [
      "CheeryMan Progress Summary",
      `Generated: ${new Date().toLocaleString()}`,
      `User: ${user?.name || "User"}`,
      "",
      "Latest Metrics",
      `- Emotional Well-being Score: ${dailyStats.moodScore ?? "N/A"}`,
      `- Wellness Journey Completion: ${dailyStats.completionRate}%`,
      `- Mindful Moments: ${dailyStats.mindfulnessCount}`,
      `- Actions Taken Today: ${dailyStats.totalActivities}`,
      "",
      "Top Insights",
      ...(insights.length
        ? insights.map((item, index) => `${index + 1}. ${item.title}: ${item.description}`)
        : ["1. No insight available yet. Continue tracking activities for personalized analysis."]),
    ];

    const blob = new Blob([summaryLines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "cheeryman-latest-progress-summary.txt";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const flowModules = [
    { title: "Journal", description: "Write and reflect", path: "/journal" },
    { title: "ERP", description: "Complete exposure tasks", path: "/erp" },
    { title: "Trigger Log", description: "Track situation-thought-reaction", path: "/triggers" },
    { title: "Therapists", description: "Get professional support", path: "/therapists" },
    { title: "Forum", description: "Anonymous peer support", path: "/forum" },
    { title: "Admin", description: "Manage system content", path: "/admin" },
  ];

  // Add handler for game activities
  const handleGamePlayed = useCallback(
    async (gameName: string, description: string) => {
      try {
        await logActivity({
          userId: "default-user",
          type: "game",
          name: gameName,
          description: description,
          duration: 0,
        });

        // Refresh activities after logging
        loadActivities();
      } catch (error) {
        console.error("Error logging game activity:", error);
      }
    },
    [loadActivities]
  );

  // Simple loading state
  if (!mounted || sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <OnboardingModal
        onCompleted={fetchDailyStats}
        manualOpenTrigger={onboardingModalTrigger}
      />
      <Container className="pt-20 pb-8 space-y-6">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-2"
          >
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, {user?.name || "there"}
            </h1>
            <p className="text-muted-foreground">
              {currentTime.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </motion.div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <Card className="border-primary/15 bg-primary/5">
          <CardContent className="p-4 md:p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-foreground">Guided Next Steps</p>
                <p className="text-sm text-muted-foreground">
                  Complete onboarding, review therapist suggestions, or download your latest progress summary.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full md:w-auto">
                <Button variant="outline" onClick={handleCompleteOnboarding}>
                  Complete onboarding
                </Button>
                <Button variant="outline" onClick={handleViewTherapists}>
                  View therapist recommendations
                </Button>
                <Button onClick={handleDownloadProgressSummary}>
                  Download latest progress summary
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Grid Layout */}
        <div className="space-y-6">
          {/* Top Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
              {/* Quick Actions Card */}
              <Card className="border-primary/10 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent" />
                <CardContent className="p-6 relative">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Quick Actions</h3>
                        <p className="text-sm text-muted-foreground">
                          Start your wellness journey
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className={cn(
                          "flex flex-col h-[120px] px-4 py-3 group/mood hover:border-primary/50",
                          "justify-center items-center text-center",
                          "transition-all duration-200 group-hover:translate-y-[-2px]"
                        )}
                        onClick={() => setShowMoodModal(true)}
                      >
                        <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center mb-2">
                          <Heart className="w-5 h-5 text-rose-500" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">Track Mood</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            How are you feeling?
                          </div>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        className={cn(
                          "flex flex-col h-[120px] px-4 py-3 group/ai hover:border-primary/50",
                          "justify-center items-center text-center",
                          "transition-all duration-200 group-hover:translate-y-[-2px]"
                        )}
                        onClick={handleAICheckIn}
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
                          <BrainCircuit className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">Check-in</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Quick wellness check
                          </div>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        className={cn(
                          "flex flex-col h-[120px] px-4 py-3 group/trends hover:border-primary/50",
                          "justify-center items-center text-center",
                          "transition-all duration-200 group-hover:translate-y-[-2px]"
                        )}
                        onClick={() => router.push("/analytics")}
                      >
                        <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center mb-2">
                          <Sparkles className="w-5 h-5 text-violet-500" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">View Trends</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            7-day analysis
                          </div>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        className={cn(
                          "flex flex-col h-[120px] px-4 py-3 group/journal hover:border-primary/50",
                          "justify-center items-center text-center",
                          "transition-all duration-200 group-hover:translate-y-[-2px]"
                        )}
                        onClick={() => router.push("/journal")}
                      >
                        <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mb-2">
                          <Calendar className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">Journal</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Reflect on your day
                          </div>
                        </div>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Start Therapy Card */}
              <Card className="border-border/80 bg-card">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <CardTitle className="text-xl flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        Start Therapy
                      </CardTitle>
                      <CardDescription>
                        Begin a guided therapy conversation whenever you need support.
                      </CardDescription>
                    </div>
                    <div className="hidden sm:flex items-center rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground">
                      Private and secure
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-md border border-border/70 bg-muted/30 px-3 py-2">
                      <p className="text-xs text-muted-foreground">Session Type</p>
                      <p className="text-sm font-medium">Guided Chat</p>
                    </div>
                    <div className="rounded-md border border-border/70 bg-muted/30 px-3 py-2">
                      <p className="text-xs text-muted-foreground">Estimated Time</p>
                      <p className="text-sm font-medium">5-15 minutes</p>
                    </div>
                  </div>

                  <Button
                    variant="default"
                    className="w-full h-11 justify-between px-4"
                    onClick={handleStartTherapy}
                  >
                    <span className="font-medium">Begin Therapy Session</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-primary/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Daily Journey Modules</CardTitle>
                  <CardDescription>Follow your full CheeryMan one place</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {flowModules.map((item) => (
                      <Button
                        key={item.title}
                        variant="outline"
                        className="h-auto p-3 flex-col items-start text-left"
                        onClick={() => router.push(item.path)}
                      >
                        <span className="font-medium">{item.title}</span>
                        <span className="text-xs text-muted-foreground mt-1">{item.description}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Today's Overview Card */}
              <Card className="border-primary/10 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-2xl">✨ Today's Wellness Hub</CardTitle>
                      <CardDescription className="text-sm">
                        {format(new Date(), "EEEE, MMMM d")} • Your daily progress snapshot
                      </CardDescription>
                    </div>
                    <motion.div
                      animate={{ rotate: isRefreshingStats ? 360 : 0 }}
                      transition={{ 
                        duration: isRefreshingStats ? 1 : 0.3,
                        repeat: isRefreshingStats ? Infinity : 0,
                        ease: "linear"
                      }}
                    >
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={fetchDailyStats}
                        className="h-9 w-9 rounded-full"
                        disabled={isRefreshingStats}
                      >
                        <Zap className={cn("h-4 w-4", isRefreshingStats && "text-amber-500")} />
                      </Button>
                    </motion.div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {wellnessStats.map((stat) => (
                      <motion.div
                        key={stat.title}
                        whileHover={{ scale: 1.03, translateY: -2 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className={cn(
                          "p-5 rounded-xl transition-all duration-300 border cursor-pointer",
                          "shadow-lg hover:shadow-xl",
                          stat.bgColor,
                          stat.borderColor,
                          "backdrop-blur-sm"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className={cn("p-2 rounded-lg", `${stat.bgColor} border`, stat.borderColor)}>
                            <stat.icon className={cn("w-5 h-5", stat.color)} />
                          </div>
                          <div />
                        </div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          {stat.title}
                        </p>
                        <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 mb-1">
                          {stat.value}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {stat.description}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-4 text-xs text-muted-foreground text-right flex items-center justify-end gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 animate-pulse" />
                    Last updated: {format(dailyStats.lastUpdated, "h:mm a")}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Insights Card */}
            <Card className="border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-primary" />
                  Insights
                </CardTitle>
                <CardDescription>
                  Personalized recommendations based on your activity patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {insights.length > 0 ? (
                    insights.map((insight, index) => (
                      <div
                        key={index}
                        className={cn(
                          "p-4 rounded-lg space-y-2 transition-all hover:scale-[1.02]",
                          insight.priority === "high"
                            ? "bg-primary/10"
                            : insight.priority === "medium"
                            ? "bg-primary/5"
                            : "bg-muted"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <insight.icon className="w-5 h-5 text-primary" />
                          <p className="font-medium">{insight.title}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {insight.description}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <Activity className="w-8 h-8 mx-auto mb-3 opacity-50" />
                      <p>
                        Complete more activities to receive personalized
                        insights
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3 space-y-6">
              <Card className="border-border/80 bg-card shadow-sm">
                <CardHeader className="border-b border-border/70">
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-rose-500" />
                    Recent Mood History
                  </CardTitle>
                  <CardDescription>
                    Your latest mood check-ins
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {moodHistory.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No mood entries yet. Use Track Mood to add your first check-in.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="h-[280px] w-full rounded-xl border border-border/70 bg-gradient-to-br from-sky-500/5 to-emerald-500/5 p-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={moodTrendData}
                            margin={{ top: 12, right: 12, left: -12, bottom: 4 }}
                          >
                            <defs>
                              <linearGradient id="moodLineGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#67a9c8" />
                                <stop offset="100%" stopColor="#79bfa5" />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              vertical={false}
                              strokeDasharray="4 4"
                              stroke="hsl(var(--border))"
                            />
                            <XAxis
                              dataKey="timestamp"
                              type="number"
                              domain={["dataMin", "dataMax"]}
                              tickFormatter={(value: number) =>
                                format(new Date(value), "MMM d")
                              }
                              axisLine={false}
                              tickLine={false}
                              minTickGap={24}
                              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                            />
                            <YAxis
                              domain={[0, 100]}
                              ticks={[0, 20, 40, 60, 80, 100]}
                              tickFormatter={(value: number) => `${value}%`}
                              axisLine={false}
                              tickLine={false}
                              width={42}
                              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                            />
                            <Tooltip
                              formatter={(value: number | string) => [
                                `${value}%`,
                                "Mood Score",
                              ]}
                              labelFormatter={(value) =>
                                format(new Date(Number(value)), "MMM d, h:mm a")
                              }
                              contentStyle={{
                                borderRadius: "0.75rem",
                                borderColor: "hsl(var(--border))",
                                backgroundColor: "hsl(var(--card))",
                                boxShadow: "none",
                              }}
                              cursor={{ stroke: "hsl(var(--muted-foreground))", strokeDasharray: "4 4" }}
                            />
                            <Line
                              type="monotoneX"
                              dataKey="score"
                              stroke="url(#moodLineGradient)"
                              strokeWidth={2.5}
                              dot={{ r: 3, strokeWidth: 2, fill: "#67a9c8", stroke: "hsl(var(--card))" }}
                              activeDot={{ r: 5, strokeWidth: 2, fill: "#79bfa5", stroke: "hsl(var(--card))" }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Showing latest {Math.min(moodHistory.length, 5)} entries</span>
                          <span>Total records: {moodHistory.length}</span>
                        </div>

                        {moodHistory.slice(0, 5).map((entry) => {
                          const recordedAt = entry.createdAt || entry.timestamp;
                          const label =
                            entry.score >= 80
                              ? "Great"
                              : entry.score >= 60
                              ? "Good"
                              : entry.score >= 40
                              ? "Neutral"
                              : entry.score >= 20
                              ? "Low"
                              : "Very Low";

                          return (
                            <div
                              key={entry._id}
                              className="rounded-xl border border-border/70 bg-card/60 px-4 py-3"
                            >
                              <div className="flex items-start justify-between gap-4">
                                 <div className="space-y-2 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                      className={cn(
                                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                                        entry.score >= 80
                                          ? "bg-emerald-500/10 text-emerald-600"
                                          : entry.score >= 60
                                          ? "bg-sky-500/10 text-sky-600"
                                          : entry.score >= 40
                                          ? "bg-slate-500/10 text-slate-600"
                                          : entry.score >= 20
                                          ? "bg-amber-500/10 text-amber-600"
                                          : "bg-rose-500/10 text-rose-600"
                                      )}
                                    >
                                      {label}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                      {entry.score}% score
                                    </span>
                                  </div>
                                  <div className="h-1.5 w-48 max-w-full rounded-full bg-muted overflow-hidden">
                                    <div
                                      className={cn(
                                        "h-full rounded-full transition-all",
                                        entry.score >= 80
                                          ? "bg-emerald-500"
                                          : entry.score >= 60
                                          ? "bg-sky-500"
                                          : entry.score >= 40
                                          ? "bg-slate-500"
                                          : entry.score >= 20
                                          ? "bg-amber-500"
                                          : "bg-rose-500"
                                      )}
                                      style={{ width: `${Math.max(0, Math.min(100, entry.score))}%` }}
                                    />
                                  </div>
                                  {entry.note ? (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                      {entry.note}
                                    </p>
                                  ) : (
                                    <p className="text-sm text-muted-foreground/70 italic">
                                      No note added
                                    </p>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground whitespace-nowrap pt-0.5">
                                  {recordedAt
                                    ? format(new Date(recordedAt), "MMM d, h:mm a")
                                    : "Unknown time"}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Anxiety Games - Now directly below Fitbit */}
              <AnxietyGames onGamePlayed={handleGamePlayed} />
            </div>
          </div>
        </div>
      </Container>

      {/* Mood tracking modal */}
      <Dialog open={showMoodModal} onOpenChange={setShowMoodModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>How are you feeling?</DialogTitle>
            <DialogDescription>
              Move the slider to track your current mood
            </DialogDescription>
          </DialogHeader>
          <MoodForm
            onSuccess={() => {
              setShowMoodModal(false);
              fetchDailyStats();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* AI check-in chat */}
      {showCheckInChat && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-background border-l shadow-lg">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h3 className="font-semibold">AI Check-in</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCheckInChat(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4"></div>
            </div>
          </div>
        </div>
      )}

      <ActivityLogger
        open={showActivityLogger}
        onOpenChange={setShowActivityLogger}
        onActivityLogged={loadActivities}
      />
    </div>
  );
}
