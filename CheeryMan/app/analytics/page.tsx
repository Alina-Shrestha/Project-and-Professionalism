"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  AreaChart,
  Area,
  ComposedChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingDown, TrendingUp, Activity, Calendar } from "lucide-react";
import { format, startOfDay, subDays } from "date-fns";
import { cn } from "@/lib/utils";

interface DailySnapshot {
  _id: string;
  date: string;
  moodScore: number;
  completionRate: number;
  totalActivities: number;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<DailySnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ avg: 0, min: 0, max: 0, trend: 0 });

  const chartData = useMemo(() => {
    const byDay = new Map<
      string,
      { moodSum: number; moodCount: number; activities: number; completion: number; hasData: boolean }
    >();

    for (const row of data) {
      const d = startOfDay(new Date(row.date));
      if (isNaN(d.getTime())) continue;
      const key = format(d, "yyyy-MM-dd");
      const prev = byDay.get(key) || {
        moodSum: 0,
        moodCount: 0,
        activities: 0,
        completion: 0,
        hasData: false,
      };

      byDay.set(key, {
        moodSum: prev.moodSum + (typeof row.moodScore === "number" ? row.moodScore : 0),
        moodCount: prev.moodCount + 1,
        activities: Math.max(prev.activities, typeof row.totalActivities === "number" ? row.totalActivities : 0),
        completion: Math.max(prev.completion, typeof row.completionRate === "number" ? row.completionRate : 0),
        hasData: true,
      });
    }

    return Array.from({ length: 7 }, (_, idx) => {
      const dayDate = startOfDay(subDays(new Date(), 6 - idx));
      const key = format(dayDate, "yyyy-MM-dd");
      const day = byDay.get(key);
      return {
        dayLabel: format(dayDate, "EEE"),
        date: format(dayDate, "MMM d"),
        mood: day && day.moodCount > 0 ? Math.round(day.moodSum / day.moodCount) : 0,
        activities: day?.activities ?? 0,
        completion: day?.completion ?? 0,
        hasData: day?.hasData ?? false,
      };
    });
  }, [data]);

  const hasAnyData = chartData.some((d) => d.hasData);
  const chartGrid = "hsl(var(--border))";
  const chartAxis = "hsl(var(--muted-foreground))";
  const chartBlue = "#67a9c8";
  const chartGreen = "#79bfa5";

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        const response = await fetch("/api/wellness/snapshot", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to fetch trends");

        const snapshots: DailySnapshot[] = await response.json();
        let last7Days = snapshots.slice(0, 7).reverse();

        // Fallback: build trend from mood history if snapshots are empty.
        if (last7Days.length === 0) {
          const moodRes = await fetch("/api/mood/history?limit=7", {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (moodRes.ok) {
            const moodJson = await moodRes.json();
            const moodRows = Array.isArray(moodJson?.data) ? moodJson.data : [];
            last7Days = moodRows
              .map((m: any) => ({
                _id: String(m._id || ""),
                date: m.createdAt || m.timestamp || new Date().toISOString(),
                moodScore: typeof m.score === "number" ? m.score : 0,
                completionRate: 0,
                totalActivities: 0,
              }))
              .reverse();
          }
        }

        setData(last7Days);

        if (last7Days.length > 0) {
          const scores = last7Days.map((d) => d.moodScore);
          const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
          const min = Math.min(...scores);
          const max = Math.max(...scores);
          const trend =
            last7Days.length > 1
              ? Math.round(last7Days[last7Days.length - 1].moodScore - last7Days[0].moodScore)
              : 0;

          setStats({ avg, min, max, trend });
        }
      } catch (error) {
        console.error("Error fetching trends:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-3 animate-pulse" />
          <p className="text-muted-foreground">Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Button variant="ghost" onClick={() => router.back()} className="gap-2 mb-6 -ml-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="space-y-2">
              <h1 className="text-4xl font-semibold tracking-tight text-foreground">Treatment Progress Report</h1>
              <p className="text-base font-normal text-muted-foreground">7-Day Anxiety & Well-being Analysis</p>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Average Score */}
          <Card className="border-border/80 bg-card/80 shadow-sm">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.08em]">
                  Avg Anxiety Level
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-semibold text-[#4a8fb0]">{stats.avg}</span>
                  <span className="text-muted-foreground text-sm">/100</span>
                </div>
                <div className="pt-2 text-xs">
                  {stats.avg < 40 ? (
                    <span className="text-emerald-600 font-medium">Improving</span>
                  ) : stats.avg < 70 ? (
                    <span className="text-amber-600 font-medium">Moderate</span>
                  ) : (
                    <span className="text-rose-600 font-medium">Elevated</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Peak Anxiety */}
          <Card className="border-border/80 bg-card/80 shadow-sm">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.08em]">
                  Peak Anxiety
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-semibold text-slate-700">{stats.max}</span>
                  <span className="text-muted-foreground text-sm">/100</span>
                </div>
                <p className="text-xs text-muted-foreground pt-2">Highest level this week</p>
              </div>
            </CardContent>
          </Card>

          {/* Best Performance */}
          <Card className="border-border/80 bg-card/80 shadow-sm">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.08em]">
                  Best Performance
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-semibold text-[#5a9f86]">{stats.min}</span>
                  <span className="text-muted-foreground text-sm">/100</span>
                </div>
                <p className="text-xs text-muted-foreground pt-2">Lowest level this week</p>
              </div>
            </CardContent>
          </Card>

          {/* Trend */}
          <Card className={cn("border-border/80 bg-card/80 shadow-sm", stats.trend < 0 ? "ring-1 ring-emerald-500/10" : "ring-1 ring-rose-500/10") }>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.08em]">
                  Weekly Trend
                </p>
                <div className="flex items-center gap-2">
                  {stats.trend < 0 ? (
                    <TrendingDown className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <TrendingUp className="w-6 h-6 text-rose-600" />
                  )}
                  <span className={cn("text-3xl font-semibold", stats.trend < 0 ? "text-emerald-600" : "text-rose-600")}>
                    {stats.trend < 0 ? "" : "+"}{stats.trend}
                  </span>
                </div>
                <p className="text-xs pt-2">
                  {stats.trend < 0 ? (
                    <span className="text-emerald-600 font-medium">Improving</span>
                  ) : (
                    <span className="text-rose-600 font-medium">Rising</span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="space-y-8">
          {/* Anxiety Progression */}
          <Card className="border-border/80 bg-card shadow-sm">
            <CardHeader className="border-b border-border/70">
              <CardTitle className="text-xl font-semibold tracking-tight">Anxiety Level Progression</CardTitle>
              <CardDescription>
                Your 7-day pattern (Mon-Sun style timeline)
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              {!hasAnyData && (
                <p className="mb-4 text-sm text-muted-foreground">
                  No entries yet. This graph still shows a full 7-day timeline and will update as soon as you log data.
                </p>
              )}
              <div className="rounded-xl border border-border/70 bg-gradient-to-br from-sky-500/5 to-emerald-500/5 p-4">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartData} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAnxiety" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartBlue} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={chartBlue} stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                    <XAxis dataKey="dayLabel" stroke={chartAxis} />
                    <YAxis domain={[0, 100]} stroke={chartAxis} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        boxShadow: "none",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="mood"
                      stroke={chartBlue}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorAnxiety)"
                      name="Anxiety Level"
                    />
                    <Line type="monotone" dataKey="mood" stroke={chartBlue} dot={false} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Treatment Engagement */}
          <Card className="border-border/80 bg-card shadow-sm">
            <CardHeader className="border-b border-border/70">
              <CardTitle className="text-xl font-semibold tracking-tight">Treatment Engagement</CardTitle>
              <CardDescription>7-day activities and completion pattern</CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              {!hasAnyData && (
                <p className="mb-4 text-sm text-muted-foreground">
                  No engagement entries yet. This view will fill in as activities are logged.
                </p>
              )}
              <div className="rounded-xl border border-border/70 bg-gradient-to-br from-sky-500/5 to-emerald-500/5 p-4">
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={chartData} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                    <XAxis dataKey="dayLabel" stroke={chartAxis} />
                    <YAxis
                      yAxisId="left"
                      stroke={chartAxis}
                      domain={[0, "dataMax + 1"]}
                      allowDecimals={false}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke={chartAxis}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        boxShadow: "none",
                      }}
                    />
                    <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 8 }} />
                    <Bar yAxisId="left" dataKey="activities" fill={chartBlue} name="Activities" radius={[6, 6, 0, 0]} barSize={16} />
                    <Bar yAxisId="right" dataKey="completion" fill={chartGreen} name="Completion %" radius={[6, 6, 0, 0]} barSize={16} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Summary */}
        <Card className="border-border/80 bg-card/80 shadow-sm">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Daily Summary
            </CardTitle>
            <CardDescription>Detailed breakdown of each day's progress</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {chartData.length > 0 ? (
              <div className="space-y-3">
                {chartData.map((day, idx) => (
                  <div key={idx} className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors bg-card/50">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2 flex-1">
                        <p className="font-semibold text-foreground">{day.date}</p>
                        <div className="flex gap-6 text-sm text-muted-foreground">
                          <span>
                            Anxiety: <span className="font-semibold text-foreground">{day.mood}/100</span>
                          </span>
                          <span>
                            Activities: <span className="font-semibold text-foreground">{day.activities}</span>
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Done</p>
                        <div
                          className={cn(
                            "px-3 py-2 rounded-lg font-semibold text-sm",
                            day.completion >= 80
                              ? "bg-emerald-100 text-emerald-700"
                              : day.completion >= 50
                              ? "bg-amber-100 text-amber-700"
                              : "bg-rose-100 text-rose-700"
                          )}
                        >
                          {day.completion}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No daily data yet</div>
            )}
          </CardContent>
        </Card>

        {/* Info Box */}
        <div className="bg-muted/40 border border-border rounded-lg p-6 space-y-2">
          <p className="text-sm font-semibold text-foreground">Insight</p>
          <p className="text-sm text-foreground">
            Track your anxiety levels daily to identify patterns. Share this report with your therapist to discuss progress and adjust treatment.
          </p>
        </div>
      </div>
    </div>
  );
}
