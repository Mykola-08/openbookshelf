import { DEFAULT_FEATURE_FLAGS } from "@/lib/config/feature-flags";

/**
 * Backwards-compatible static defaults.
 * For runtime user-controlled feature activation/deactivation, use `useFeatureFlags`.
 */
export const features = DEFAULT_FEATURE_FLAGS;
