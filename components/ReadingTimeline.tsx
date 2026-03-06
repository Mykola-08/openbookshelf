"use client";

import { Calendar, BookOpen, Star, Flag, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface TimelineEvent {
  date: string;
  label: string;
  icon: "started" | "progress" | "finished" | "rated" | "added";
  detail?: string;
}

interface ReadingTimelineProps {
  status: string;
  progress?: number | null;
  rating?: number | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  createdAt?: string | null;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysBetween(a: string, b: string) {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

const ICON_MAP = {
  added: Clock,
  started: BookOpen,
  progress: TrendingUp,
  finished: Flag,
  rated: Star,
};

const COLOR_MAP = {
  added: "bg-muted text-muted-foreground",
  started: "bg-status-info/10 text-status-info",
  progress: "bg-status-warning/10 text-status-warning",
  finished: "bg-status-success/10 text-status-success",
  rated: "bg-status-error/10 text-status-error",
};

export function ReadingTimeline({
  status,
  progress,
  rating,
  startedAt,
  finishedAt,
  createdAt,
}: ReadingTimelineProps) {
  const events: TimelineEvent[] = [];

  if (createdAt) {
    events.push({ date: createdAt, label: "Added to library", icon: "added" });
  }

  if (startedAt) {
    events.push({ date: startedAt, label: "Started reading", icon: "started" });
  }

  if (status === "reading" && progress && progress > 0) {
    events.push({
      date: new Date().toISOString(),
      label: `Reading — ${progress}% complete`,
      icon: "progress",
    });
  }

  if (finishedAt) {
    const detail =
      startedAt
        ? `Finished in ${daysBetween(startedAt, finishedAt)} days`
        : undefined;
    events.push({ date: finishedAt, label: "Finished", icon: "finished", detail });
  }

  if (rating && rating > 0) {
    events.push({
      date: finishedAt || createdAt || new Date().toISOString(),
      label: `Rated ${rating}/5`,
      icon: "rated",
      detail: "★".repeat(rating) + "☆".repeat(5 - rating),
    });
  }

  if (events.length === 0) {
    return null;
  }

  // Sort chronologically
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <Card className="bg-muted/20 border-none shadow-none">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-6 border-b pb-2">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-medium text-foreground text-lg">Reading Timeline</h3>
        </div>

        <div className="relative pl-8">
          {/* Vertical line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

          <div className="space-y-6">
            {events.map((event, i) => {
              const Icon = ICON_MAP[event.icon];
              const colorClass = COLOR_MAP[event.icon];
              return (
                <div key={i} className="relative flex items-start gap-4">
                  {/* Dot on the line */}
                  <div
                    className={`absolute -left-8 w-8 h-8 rounded-full flex items-center justify-center ${colorClass} ring-4 ring-background`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="pt-1">
                    <p className="text-sm font-medium text-foreground">{event.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(event.date)}</p>
                    {event.detail && (
                      <p className="text-xs text-muted-foreground mt-1">{event.detail}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
