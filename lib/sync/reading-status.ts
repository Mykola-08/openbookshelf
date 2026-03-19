export type ReadingStatus = "toread" | "reading" | "finished" | "paused" | "dropped";

export interface ReadingStatusResolution {
  nextStatus: ReadingStatus;
  startedAt: string | null;
  finishedAt: string | null;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function resolveReadingStatus(args: {
  currentStatus?: string | null;
  progressPercent?: number | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  nowIso?: string;
}): ReadingStatusResolution {
  const nowIso = args.nowIso ?? new Date().toISOString();
  const progress = clamp(Number(args.progressPercent ?? 0), 0, 100);
  const normalizedStatus = (args.currentStatus ?? "toread") as ReadingStatus;

  if (progress >= 99.5) {
    return {
      nextStatus: "finished",
      startedAt: args.startedAt ?? nowIso,
      finishedAt: args.finishedAt ?? nowIso,
    };
  }

  if (progress > 0 && (normalizedStatus === "toread" || normalizedStatus === "paused")) {
    return {
      nextStatus: "reading",
      startedAt: args.startedAt ?? nowIso,
      finishedAt: null,
    };
  }

  if (normalizedStatus === "finished" && progress < 99.5) {
    return {
      nextStatus: "reading",
      startedAt: args.startedAt ?? nowIso,
      finishedAt: null,
    };
  }

  return {
    nextStatus: normalizedStatus,
    startedAt: args.startedAt ?? null,
    finishedAt: normalizedStatus === "finished" ? args.finishedAt ?? nowIso : null,
  };
}
