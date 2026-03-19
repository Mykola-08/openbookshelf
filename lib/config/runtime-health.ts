import { getDatabaseRuntimeInfo } from "@/lib/config/database";

export interface RuntimeCheck {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
}

export interface RuntimeHealthReport {
  provider: string;
  checks: RuntimeCheck[];
  ready: boolean;
}

export const getRuntimeHealthReport = (): RuntimeHealthReport => {
  const db = getDatabaseRuntimeInfo();

  const checks: RuntimeCheck[] = [
    {
      id: "db-provider",
      label: "Database provider",
      ok: Boolean(db.resolvedProvider),
      detail: `Using ${db.providerLabel}`,
    },
    {
      id: "external-token",
      label: "External API token",
      ok: Boolean(process.env.EXTERNAL_SYNC_TOKEN),
      detail: process.env.EXTERNAL_SYNC_TOKEN
        ? "EXTERNAL_SYNC_TOKEN configured"
        : "Set EXTERNAL_SYNC_TOKEN for /api/v1/* integration endpoints",
    },
    {
      id: "ai-provider",
      label: "AI provider key",
      ok: Boolean(
        process.env.OPENROUTER_API_KEY ||
          process.env.OPENAI_API_KEY ||
          process.env.GOOGLE_GENERATIVE_AI_API_KEY
      ),
      detail:
        process.env.OPENROUTER_API_KEY ||
        process.env.OPENAI_API_KEY ||
        process.env.GOOGLE_GENERATIVE_AI_API_KEY
          ? "At least one AI provider is configured"
          : "No AI key found (OPENROUTER_API_KEY / OPENAI_API_KEY / GOOGLE_GENERATIVE_AI_API_KEY)",
    },
    {
      id: "reader",
      label: "Reader module",
      ok: process.env.NEXT_PUBLIC_ENABLE_LOCAL_READER !== "false",
      detail:
        process.env.NEXT_PUBLIC_ENABLE_LOCAL_READER === "false"
          ? "Reader disabled by NEXT_PUBLIC_ENABLE_LOCAL_READER=false"
          : "Reader enabled",
    },
    {
      id: "tracker",
      label: "Tracker module",
      ok: process.env.NEXT_PUBLIC_ENABLE_TRACKER !== "false",
      detail:
        process.env.NEXT_PUBLIC_ENABLE_TRACKER === "false"
          ? "Tracker disabled by NEXT_PUBLIC_ENABLE_TRACKER=false"
          : "Tracker enabled",
    },
  ];

  return {
    provider: db.resolvedProvider,
    checks,
    ready: checks.every((check) => check.ok),
  };
};
