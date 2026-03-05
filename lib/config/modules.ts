export const MODULE_COOKIE_NAME = "obs_modules";
export const MODULE_STORAGE_KEY = "obs.modules.v1";

export type BuiltinModuleId =
  | "advanced_reader"
  | "offline_cache"
  | "book_summary"
  | "chapter_summary"
  | "import_automation"
  | "account_center"
  | "alias_resolution"
  | "community_alias_review"
  | "settings_sync"
  | "theme_studio"
  | "merge_assistant"
  | "notification_center"
  | "ai_generation";

export interface BuiltinModule {
  id: BuiltinModuleId;
  title: string;
  description: string;
  category:
    | "reader"
    | "library"
    | "automation"
    | "account"
    | "community"
    | "platform"
    | "ui";
}

export interface CustomModule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface ModuleState {
  enabled: Record<string, boolean>;
  customModules: CustomModule[];
}

export const BUILTIN_MODULES: BuiltinModule[] = [
  {
    id: "ai_generation",
    title: "AI Generation Features",
    description: "Enable AI-powered book and chapter summaries using OpenAI, OpenRouter, or Gemini.",
        category: "platform",
  },

  {
    id: "advanced_reader",
    title: "Advanced Reader Controls",
    description: "Extra typography and layout controls in the reader.",
    category: "reader",
  },
  {
    id: "offline_cache",
    title: "Offline Cache",
    description: "Cache reading metadata and recently opened books locally.",
    category: "reader",
  },
  {
    id: "book_summary",
    title: "Book Summaries",
    description: "Show generated summaries on book pages.",
    category: "library",
  },
  {
    id: "chapter_summary",
    title: "Chapter Summaries",
    description: "Show chapter-level summary insights when chapter data exists.",
    category: "library",
  },
  {
    id: "import_automation",
    title: "Import Automation",
    description: "Enable automated import-related settings and defaults.",
    category: "automation",
  },
  {
    id: "account_center",
    title: "Account Center",
    description: "Expose account profile and personal advanced settings.",
    category: "account",
  },
  {
    id: "alias_resolution",
    title: "Book Alias Resolution",
    description: "Track alternate titles and make aliases searchable globally.",
    category: "library",
  },
  {
    id: "community_alias_review",
    title: "Community Alias Review",
    description: "Collect same-book votes and auto-approve trusted aliases.",
    category: "community",
  },
  {
    id: "settings_sync",
    title: "Settings Sync",
    description: "Persist advanced preferences in database and sync across devices.",
    category: "platform",
  },
  {
    id: "theme_studio",
    title: "Theme Studio",
    description: "Customize accent/surface color tokens from settings.",
    category: "ui",
  },
  {
    id: "merge_assistant",
    title: "Merge Assistant",
    description: "Use similarity thresholds and alias proposals during import merge.",
    category: "automation",
  },
  {
    id: "notification_center",
    title: "Notification Center",
    description: "Prepare event channel preferences for future chapter and merge notifications.",
    category: "platform",
  },
];

export const DEFAULT_MODULE_STATE: ModuleState = {
  enabled: {
    advanced_reader: true,
    offline_cache: true,
    book_summary: true,
    chapter_summary: true,
    import_automation: false,
    account_center: true,
    alias_resolution: true,
    community_alias_review: true,
    settings_sync: true,
    theme_studio: true,
    merge_assistant: true,
    notification_center: false,
    ai_generation: true,
  },
  customModules: [],
};

export const parseModuleState = (raw: string | null | undefined): ModuleState => {
  if (!raw) return DEFAULT_MODULE_STATE;
  try {
    const parsed = JSON.parse(raw) as Partial<ModuleState>;
    return {
      enabled: {
        ...DEFAULT_MODULE_STATE.enabled,
        ...(parsed.enabled || {}),
      },
      customModules: Array.isArray(parsed.customModules)
        ? parsed.customModules.filter(
            (module): module is CustomModule =>
              Boolean(module) &&
              typeof module.id === "string" &&
              typeof module.name === "string" &&
              typeof module.description === "string" &&
              typeof module.enabled === "boolean"
          )
        : [],
    };
  } catch {
    return DEFAULT_MODULE_STATE;
  }
};

export const serializeModuleState = (state: ModuleState): string => JSON.stringify(state);
