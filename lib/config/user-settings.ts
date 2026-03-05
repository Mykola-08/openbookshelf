export type QuickImportMode = "ask" | "auto_merge" | "always_new";

/**
 * Central user preferences model for advanced customization.
 * This is intentionally flattened and serializable so it can be stored in JSONB.
 */
export interface UserSettings {
  theme: "light" | "dark" | "system";
  themeAccent: string;
  surfaceAccentA: string;
  surfaceAccentB: string;
  cacheLimitMb: number;
  summaryDepth: "short" | "balanced" | "deep";
  autoPrefetch: boolean;
  mergeSimilarityThreshold: number;
  mergeReviewThreshold: number;
  aliasVoteQuorum: number;
  askBeforeAliasMerge: boolean;
  quickImportMode: QuickImportMode;
  // Reader specifics
  fontSize: number;
  fontFamily: "sans" | "serif" | "mono";
  lineHeight: number;
  // Community toggles
  enableCommunity: boolean;
  enableReviews: boolean;
  enableGoals: boolean;
  enableActivityFeed: boolean;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  theme: "system",
  themeAccent: "#2563eb",
  surfaceAccentA: "#dbeafe",
  surfaceAccentB: "#ecfeff",
  cacheLimitMb: 120,
  summaryDepth: "balanced",
  autoPrefetch: true,
  mergeSimilarityThreshold: 0.84,
  mergeReviewThreshold: 0.68,
  aliasVoteQuorum: 3,
  askBeforeAliasMerge: true,
  quickImportMode: "ask",
  // Reader specifics
  fontSize: 16,
  fontFamily: "serif",
  lineHeight: 1.5,
  // Community toggles
  enableCommunity: true,
  enableReviews: true,
  enableGoals: true,
  enableActivityFeed: true,
};

export const USER_SETTINGS_STORAGE_KEY = "obs.settings.v2";

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const normalizeUserSettings = (
  partial?: Partial<UserSettings> | null
): UserSettings => {
  const source = partial || {};
  return {
    ...DEFAULT_USER_SETTINGS,
    ...source,
    cacheLimitMb: clamp(Number(source.cacheLimitMb ?? DEFAULT_USER_SETTINGS.cacheLimitMb), 50, 2000),
    mergeSimilarityThreshold: clamp(
      Number(source.mergeSimilarityThreshold ?? DEFAULT_USER_SETTINGS.mergeSimilarityThreshold),
      0.5,
      0.99
    ),
    mergeReviewThreshold: clamp(
      Number(source.mergeReviewThreshold ?? DEFAULT_USER_SETTINGS.mergeReviewThreshold),
      0.4,
      0.95
    ),
    aliasVoteQuorum: clamp(Number(source.aliasVoteQuorum ?? DEFAULT_USER_SETTINGS.aliasVoteQuorum), 2, 10),
    summaryDepth:
      source.summaryDepth === "short" || source.summaryDepth === "deep" || source.summaryDepth === "balanced"
        ? source.summaryDepth
        : DEFAULT_USER_SETTINGS.summaryDepth,
    quickImportMode:
      source.quickImportMode === "auto_merge" ||
      source.quickImportMode === "always_new" ||
      source.quickImportMode === "ask"
        ? source.quickImportMode
        : DEFAULT_USER_SETTINGS.quickImportMode,
    autoPrefetch:
      typeof source.autoPrefetch === "boolean"
        ? source.autoPrefetch
        : DEFAULT_USER_SETTINGS.autoPrefetch,
    askBeforeAliasMerge:
      typeof source.askBeforeAliasMerge === "boolean"
        ? source.askBeforeAliasMerge
        : DEFAULT_USER_SETTINGS.askBeforeAliasMerge,
    theme: source.theme === "light" || source.theme === "dark" || source.theme === "system" ? source.theme : DEFAULT_USER_SETTINGS.theme,
    fontSize: clamp(Number(source.fontSize ?? DEFAULT_USER_SETTINGS.fontSize), 12, 32),
    lineHeight: clamp(Number(source.lineHeight ?? DEFAULT_USER_SETTINGS.lineHeight), 1.0, 2.5),
    fontFamily: source.fontFamily === "sans" || source.fontFamily === "serif" || source.fontFamily === "mono" ? source.fontFamily : DEFAULT_USER_SETTINGS.fontFamily,
  };
};

export const parseUserSettings = (raw: string | null | undefined): UserSettings => {
  if (!raw) return DEFAULT_USER_SETTINGS;
  try {
    return normalizeUserSettings(JSON.parse(raw) as Partial<UserSettings>);
  } catch {
    return DEFAULT_USER_SETTINGS;
  }
};
