export interface FeatureFlags {
  enableLocalReader: boolean;
  enableProgressTracker: boolean;
  enableOpdsDiscover: boolean;
}

export type FeatureFlagKey = keyof FeatureFlags;

export type FeaturePresetId =
  | "balanced"
  | "tracker_focus"
  | "reader_focus"
  | "discovery_focus";

export const FEATURE_COOKIE_NAME = "obs_features";
export const FEATURE_STORAGE_KEY = "obs.features.v1";
export const ONBOARDING_DONE_KEY = "obs.onboarding.completed.v1";

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  enableLocalReader: process.env.NEXT_PUBLIC_ENABLE_LOCAL_READER !== "false",
  enableProgressTracker: process.env.NEXT_PUBLIC_ENABLE_TRACKER !== "false",
  enableOpdsDiscover: process.env.NEXT_PUBLIC_ENABLE_OPDS !== "false",
};

export const FEATURE_LABELS: Record<FeatureFlagKey, { title: string; description: string }> = {
  enableLocalReader: {
    title: "Library Reader",
    description: "Book pages, in-browser reader, authors, series, and file-based reading.",
  },
  enableProgressTracker: {
    title: "Progress Tracker",
    description: "Kanban-style tracking for reading, planned, completed, and dropped books.",
  },
  enableOpdsDiscover: {
    title: "OPDS Discovery",
    description: "Catalog browsing for public OPDS sources and external library discovery.",
  },
};

export const FEATURE_PRESETS: Record<
  FeaturePresetId,
  { title: string; description: string; flags: FeatureFlags }
> = {
  balanced: {
    title: "Balanced",
    description: "Recommended for most users. Includes reader, tracking, and discovery.",
    flags: {
      enableLocalReader: true,
      enableProgressTracker: true,
      enableOpdsDiscover: true,
    },
  },
  tracker_focus: {
    title: "Tracker Focus",
    description: "Minimal mode for reading-status management with progress tracking only.",
    flags: {
      enableLocalReader: false,
      enableProgressTracker: true,
      enableOpdsDiscover: false,
    },
  },
  reader_focus: {
    title: "Reader Focus",
    description: "Reading-first mode with import and reader pages, without OPDS discovery.",
    flags: {
      enableLocalReader: true,
      enableProgressTracker: true,
      enableOpdsDiscover: false,
    },
  },
  discovery_focus: {
    title: "Discovery Focus",
    description: "Catalog exploration mode with OPDS discovery and reading enabled.",
    flags: {
      enableLocalReader: true,
      enableProgressTracker: false,
      enableOpdsDiscover: true,
    },
  },
};

const isFeatureFlagKey = (key: string): key is FeatureFlagKey =>
  key === "enableLocalReader" || key === "enableProgressTracker" || key === "enableOpdsDiscover";

export const normalizeFeatureFlags = (partial?: Partial<FeatureFlags>): FeatureFlags => {
  return {
    ...DEFAULT_FEATURE_FLAGS,
    ...partial,
  };
};

export const parseFeatureFlags = (raw: string | null | undefined): FeatureFlags => {
  if (!raw) return normalizeFeatureFlags();

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const next: Partial<FeatureFlags> = {};

    Object.entries(parsed).forEach(([key, value]) => {
      if (isFeatureFlagKey(key) && typeof value === "boolean") {
        next[key] = value;
      }
    });

    return normalizeFeatureFlags(next);
  } catch {
    return normalizeFeatureFlags();
  }
};

export const serializeFeatureFlags = (flags: FeatureFlags): string => JSON.stringify(flags);

export const getPresetFlags = (presetId: FeaturePresetId): FeatureFlags =>
  FEATURE_PRESETS[presetId].flags;

export const getFeatureModeLabel = (flags: FeatureFlags): string => {
  if (flags.enableLocalReader && flags.enableProgressTracker && flags.enableOpdsDiscover) {
    return "Balanced";
  }
  if (!flags.enableLocalReader && flags.enableProgressTracker && !flags.enableOpdsDiscover) {
    return "Tracker Focus";
  }
  if (flags.enableLocalReader && flags.enableProgressTracker && !flags.enableOpdsDiscover) {
    return "Reader Focus";
  }
  if (flags.enableLocalReader && !flags.enableProgressTracker && flags.enableOpdsDiscover) {
    return "Discovery Focus";
  }
  return "Custom";
};

export const getFallbackRoute = (flags: FeatureFlags): string => {
  if (flags.enableLocalReader) return "/";
  if (flags.enableProgressTracker) return "/tracker";
  if (flags.enableOpdsDiscover) return "/discover";
  return "/settings";
};
