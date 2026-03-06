"use client";

import { useMemo } from "react";
import { BookOpen, CheckCircle2, Flame, Target, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface BookEntry {
  id: string;
  status: string;
  progress?: number;
  started_at?: string | null;
  finished_at?: string | null;
  created_at?: string | null;
  books?: {
    title?: string;
    authors?: { name: string }[];
  };
}

interface ReadingInsightsProps {
  books: BookEntry[];
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-foreground leading-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function ReadingInsights({ books }: ReadingInsightsProps) {
  const stats = useMemo(() => {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const reading = books.filter((b) => b.status === "reading");
    const finished = books.filter((b) => b.status === "finished");
    const finishedThisYear = finished.filter(
      (b) => b.finished_at && new Date(b.finished_at) >= yearStart
    );

    // Calculate reading streak (consecutive days with progress or finish)
    const activityDates = new Set<string>();
    books.forEach((b) => {
      if (b.started_at) activityDates.add(new Date(b.started_at).toDateString());
      if (b.finished_at) activityDates.add(new Date(b.finished_at).toDateString());
    });

    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (activityDates.has(d.toDateString())) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    // Average completion time
    const completionTimes = finished
      .filter((b) => b.started_at && b.finished_at)
      .map((b) => {
        const ms = new Date(b.finished_at!).getTime() - new Date(b.started_at!).getTime();
        return Math.round(ms / (1000 * 60 * 60 * 24));
      });
    const avgDays =
      completionTimes.length > 0
        ? Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length)
        : 0;

    // Average progress of currently reading
    const avgProgress =
      reading.length > 0
        ? Math.round(
            reading.reduce((sum, b) => sum + (b.progress || 0), 0) / reading.length
          )
        : 0;

    return {
      totalBooks: books.length,
      currentlyReading: reading.length,
      totalFinished: finished.length,
      finishedThisYear: finishedThisYear.length,
      streak,
      avgDays,
      avgProgress,
    };
  }, [books]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-muted-foreground" />
        Reading Insights
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={BookOpen}
          label="Currently Reading"
          value={stats.currentlyReading}
          sub={stats.avgProgress > 0 ? `${stats.avgProgress}% avg progress` : undefined}
          color="bg-status-info/10 text-status-info"
        />
        <StatCard
          icon={CheckCircle2}
          label="Finished"
          value={stats.totalFinished}
          sub={`${stats.finishedThisYear} this year`}
          color="bg-status-success/10 text-status-success"
        />
        <StatCard
          icon={Flame}
          label="Day Streak"
          value={stats.streak}
          sub={stats.streak > 0 ? "Keep it going!" : "Start reading today"}
          color="bg-status-warning/10 text-status-warning"
        />
        <StatCard
          icon={Clock}
          label="Avg. Completion"
          value={stats.avgDays > 0 ? `${stats.avgDays}d` : "—"}
          sub={stats.avgDays > 0 ? "days per book" : "No data yet"}
          color="bg-status-error/10 text-status-error"
        />
      </div>

      {/* Year progress bar */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {new Date().getFullYear()} Reading Goal
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              {stats.finishedThisYear} / 12 books
            </span>
          </div>
          <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.min((stats.finishedThisYear / 12) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            {stats.finishedThisYear >= 12
              ? "Goal reached! Amazing work!"
              : `${12 - stats.finishedThisYear} more to reach your goal`}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
