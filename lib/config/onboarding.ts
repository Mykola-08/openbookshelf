import type { FeaturePresetId } from "@/lib/config/feature-flags";

export const ONBOARDING_OPEN_EVENT = "obs:onboarding:open";

export type OnboardingVariantId =
  | "cloud"
  | "self_hosted_guest"
  | "self_hosted_admin"
  | "self_hosted_member";

export type OnboardingRole = "admin" | "member" | "guest";

export interface OnboardingStepDefinition {
  id: "welcome" | "mode" | "next";
  title: string;
  description: string;
}

export interface OnboardingChecklistItem {
  href: string;
  label: string;
}

export interface OnboardingWelcomeItem {
  id: "reader" | "tracker" | "discover" | "self_hosted";
  text: string;
}

export interface OnboardingVariantDefinition {
  id: OnboardingVariantId;
  label: string;
  description: string;
  recommendedPreset: FeaturePresetId;
  welcomeItems: OnboardingWelcomeItem[];
  modeHint: string;
  checklist: OnboardingChecklistItem[];
}

export const ONBOARDING_STEPS: readonly OnboardingStepDefinition[] = [
  {
    id: "welcome",
    title: "Welcome to OpenBookshelf",
    description:
      "OpenBookshelf can run as a full reading platform, a pure tracker, or a discovery-first catalog browser.",
  },
  {
    id: "mode",
    title: "Choose your mode",
    description: "Pick a preset for your use case. You can always change this later in Settings.",
  },
  {
    id: "next",
    title: "Get started checklist",
    description: "Use these next actions to connect sources, import books, and start reading quickly.",
  },
] as const;

const defaultWelcomeItems: OnboardingWelcomeItem[] = [
  { id: "reader", text: "Read EPUB files directly in the browser." },
  { id: "tracker", text: "Track reading states across your library." },
  { id: "discover", text: "Discover books through OPDS catalogs." },
];

export const ONBOARDING_VARIANTS: Record<OnboardingVariantId, OnboardingVariantDefinition> = {
  cloud: {
    id: "cloud",
    label: "Cloud",
    description: "Managed user mode with standard reading and discovery workflow.",
    recommendedPreset: "balanced",
    welcomeItems: defaultWelcomeItems,
    modeHint: "Use Balanced mode unless you need a focused workflow.",
    checklist: [
      { href: "/connections", label: "Connect a source in Connections" },
      { href: "/", label: "Search and filter books in Library" },
      { href: "/settings", label: "Adjust features and modes in Settings" },
    ],
  },
  self_hosted_guest: {
    id: "self_hosted_guest",
    label: "Self-hosted Guest",
    description: "Instance mode detected. Sign in to unlock role-based controls.",
    recommendedPreset: "balanced",
    welcomeItems: [
      ...defaultWelcomeItems,
      {
        id: "self_hosted",
        text: "First authenticated user is auto-provisioned as instance admin.",
      },
    ],
    modeHint: "After sign-in, admins can manage modules for the whole instance.",
    checklist: [
      { href: "/login", label: "Sign in to claim instance role" },
      { href: "/connections", label: "Connect import sources and verify connectivity" },
      { href: "/settings", label: "Tune feature presets for your deployment" },
    ],
  },
  self_hosted_admin: {
    id: "self_hosted_admin",
    label: "Self-hosted Admin",
    description: "Admin onboarding with module governance and instance configuration focus.",
    recommendedPreset: "reader_focus",
    welcomeItems: [
      ...defaultWelcomeItems,
      {
        id: "self_hosted",
        text: "As admin, you can activate modules and shape the entire instance UX.",
      },
    ],
    modeHint: "Reader Focus is recommended as a strong base, then enable modules gradually.",
    checklist: [
      { href: "/modules", label: "Open Modules Marketplace and choose active modules" },
      { href: "/connections", label: "Configure trusted import sources and sync policies" },
      { href: "/account", label: "Review role and account capabilities" },
    ],
  },
  self_hosted_member: {
    id: "self_hosted_member",
    label: "Self-hosted Member",
    description: "Member onboarding focused on reading and personal settings.",
    recommendedPreset: "balanced",
    welcomeItems: [
      ...defaultWelcomeItems,
      {
        id: "self_hosted",
        text: "Your admin controls instance modules; your settings stay personal.",
      },
    ],
    modeHint: "Balanced keeps reading, tracking, and discovery enabled.",
    checklist: [
      { href: "/connections", label: "Connect or browse available sources" },
      { href: "/", label: "Build your library and start reading" },
      { href: "/settings", label: "Set reader preferences and feature mode" },
    ],
  },
};

interface VariantResolverInput {
  isSelfHosted: boolean;
  isAuthenticated: boolean;
  role: OnboardingRole;
}

/**
 * Central resolver for onboarding variant selection.
 * Keeping this in config, not component code, makes future onboarding branches
 * easier to add without touching UI rendering logic.
 */
export const resolveOnboardingVariant = ({
  isSelfHosted,
  isAuthenticated,
  role,
}: VariantResolverInput): OnboardingVariantId => {
  if (!isSelfHosted) return "cloud";
  if (!isAuthenticated) return "self_hosted_guest";
  if (role === "admin") return "self_hosted_admin";
  return "self_hosted_member";
};
