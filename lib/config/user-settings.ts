export type QuickImportMode = "ask" | "auto_merge" | "always_new";
export type AIProvider = "auto" | "openrouter" | "openai" | "google";
export type AISummaryLength = "short" | "balanced" | "detailed";

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
  aiProvider: AIProvider;
  aiModel: string;
  aiTemperature: number;
  aiSummaryLength: AISummaryLength;
  // Reader specifics
  fontSize: number;
  fontFamily: "sans" | "serif" | "mono";
  lineHeight: number;
  // Community toggles
  enableCommunity: boolean;
  enableReviews: boolean;
  enableGoals: boolean;
  enableActivityFeed: boolean;
  enableTrackingQuantity: boolean;
  // Granular feature visibility toggles
  enableCommandPalette: boolean;
  enableScrollToTop: boolean;
  enableBookHealth: boolean;
  enableReadingTimeline: boolean;
  enableReadingInsights: boolean;
  enableQuickActions: boolean;
  enableBulkActions: boolean;
  enableAdvancedSearch: boolean;
  enableMatchingInbox: boolean;
  enableSourceProvenance: boolean;
  enableCopyButtons: boolean;
  enableChapters: boolean;
  enableBookSummary: boolean;
  enableAliases: boolean;
  enableConnections: boolean;
  enableCatalogDropdown: boolean;
}

export type UserSettingPresetId = "minimalist" | "balanced" | "power_reader" | "writer";

export const USER_SETTING_PRESETS: Record<
  UserSettingPresetId,
  { title: string; description: string; settings: Partial<UserSettings> }
> = {
  minimalist: {
    title: "Minimalist",
    description: "Just you and your books. No metrics, no feed, no noise.",
    settings: {
      enableCommunity: false,
      enableReviews: false,
      enableGoals: false,
      enableActivityFeed: false,
      enableTrackingQuantity: false,
      autoPrefetch: false,
      summaryDepth: "short",
      aiSummaryLength: "short",
      enableBookHealth: false,
      enableReadingTimeline: false,
      enableReadingInsights: false,
      enableQuickActions: false,
      enableBulkActions: false,
      enableAdvancedSearch: false,
      enableMatchingInbox: false,
      enableSourceProvenance: false,
      enableCopyButtons: false,
      enableAliases: false,
      enableCatalogDropdown: false,
    },
  },
  balanced: {
    title: "Balanced",
    description: "Perfect for most readers. Useful metrics without being overwhelming.",
    settings: {
      enableCommunity: true,
      enableReviews: true,
      enableGoals: true,
      enableActivityFeed: false,
      enableTrackingQuantity: false,
      autoPrefetch: true,
      summaryDepth: "balanced",
      aiSummaryLength: "balanced",
      enableBookHealth: false,
      enableReadingTimeline: true,
      enableReadingInsights: true,
      enableQuickActions: true,
      enableBulkActions: false,
      enableAdvancedSearch: false,
      enableMatchingInbox: false,
      enableSourceProvenance: false,
      enableCopyButtons: false,
      enableAliases: false,
      enableCatalogDropdown: true,
    },
  },
  power_reader: {
    title: "Power Reader",
    description: "For the data-driven library. Tracking, velocity, and community insights.",
    settings: {
      enableCommunity: true,
      enableReviews: true,
      enableGoals: true,
      enableActivityFeed: true,
      enableTrackingQuantity: true,
      autoPrefetch: true,
      summaryDepth: "deep",
      aiSummaryLength: "detailed",
      enableBookHealth: true,
      enableReadingTimeline: true,
      enableReadingInsights: true,
      enableQuickActions: true,
      enableBulkActions: true,
      enableAdvancedSearch: true,
      enableMatchingInbox: true,
      enableSourceProvenance: true,
      enableCopyButtons: true,
      enableAliases: true,
      enableCatalogDropdown: true,
    },
  },
  writer: {
    title: "Researcher",
    description: "Focused on depth. High-quality summaries and alias resolution focus.",
    settings: {
      enableCommunity: true,
      enableReviews: true,
      enableGoals: false,
      enableActivityFeed: false,
      enableTrackingQuantity: false,
      summaryDepth: "deep",
      aiSummaryLength: "detailed",
      autoPrefetch: true,
      enableBookHealth: true,
      enableReadingTimeline: true,
      enableReadingInsights: true,
      enableQuickActions: false,
      enableBulkActions: false,
      enableAdvancedSearch: true,
      enableMatchingInbox: true,
      enableSourceProvenance: true,
      enableCopyButtons: true,
      enableAliases: true,
      enableCatalogDropdown: true,
    },
  },
};

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
  aiProvider: "auto",
  aiModel: "",
  aiTemperature: 0.4,
  aiSummaryLength: "balanced",
  // Reader specifics
  fontSize: 16,
  fontFamily: "serif",
  lineHeight: 1.5,
  // Community & Tracking toggles
  enableCommunity: false,
  enableReviews: false,
  enableGoals: false,
  enableActivityFeed: false,
  enableTrackingQuantity: false,
  // Granular feature visibility — uncommon/niche features off by default
  enableCommandPalette: true,
  enableScrollToTop: true,
  enableBookHealth: false,
  enableReadingTimeline: false,
  enableReadingInsights: true,
  enableQuickActions: true,
  enableBulkActions: false,
  enableAdvancedSearch: false,
  enableMatchingInbox: false,
  enableSourceProvenance: false,
  enableCopyButtons: false,
  enableChapters: true,
  enableBookSummary: true,
  enableAliases: false,
  enableConnections: true,
  enableCatalogDropdown: true,
};

export const USER_SETTINGS_STORAGE_KEY = "obs.settings.v2";
export const USER_SETTINGS_COOKIE_NAME = "obs_user_settings";

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
    aiProvider:
      source.aiProvider === "auto" ||
      source.aiProvider === "openrouter" ||
      source.aiProvider === "openai" ||
      source.aiProvider === "google"
        ? source.aiProvider
        : DEFAULT_USER_SETTINGS.aiProvider,
    aiModel:
      typeof source.aiModel === "string" ? source.aiModel.slice(0, 120) : DEFAULT_USER_SETTINGS.aiModel,
    aiTemperature: clamp(Number(source.aiTemperature ?? DEFAULT_USER_SETTINGS.aiTemperature), 0, 1),
    aiSummaryLength:
      source.aiSummaryLength === "short" ||
      source.aiSummaryLength === "balanced" ||
      source.aiSummaryLength === "detailed"
        ? source.aiSummaryLength
        : DEFAULT_USER_SETTINGS.aiSummaryLength,
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
