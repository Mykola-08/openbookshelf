"use client";

import { useCallback, useMemo, useState } from "react";
import {
  DEFAULT_FEATURE_FLAGS,
  FEATURE_COOKIE_NAME,
  FEATURE_PRESETS,
  FEATURE_STORAGE_KEY,
  type FeatureFlagKey,
  type FeatureFlags,
  type FeaturePresetId,
  parseFeatureFlags,
  serializeFeatureFlags,
} from "@/lib/config/feature-flags";

const readCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const pair = document.cookie
    .split("; ")
    .find((segment) => segment.startsWith(`${name}=`));
  if (!pair) return null;
  return decodeURIComponent(pair.split("=")[1] || "");
};

const writeCookie = (name: string, value: string, days: number) => {
  if (typeof document === "undefined") return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`;
};

const readInitialFlags = (): FeatureFlags => {
  if (typeof window === "undefined") return DEFAULT_FEATURE_FLAGS;

  const fromStorage = window.localStorage.getItem(FEATURE_STORAGE_KEY);
  if (fromStorage) {
    return parseFeatureFlags(fromStorage);
  }

  const fromCookie = readCookie(FEATURE_COOKIE_NAME);
  if (fromCookie) {
    return parseFeatureFlags(fromCookie);
  }

  return DEFAULT_FEATURE_FLAGS;
};

export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlags>(readInitialFlags);

  const persist = useCallback((nextFlags: FeatureFlags) => {
    const serialized = serializeFeatureFlags(nextFlags);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(FEATURE_STORAGE_KEY, serialized);
    }
    writeCookie(FEATURE_COOKIE_NAME, serialized, 365);
  }, []);

  const updateFlags = useCallback(
    (nextFlags: FeatureFlags) => {
      setFlags(nextFlags);
      persist(nextFlags);
    },
    [persist]
  );

  const setFeatureFlag = useCallback(
    (key: FeatureFlagKey, value: boolean) => {
      updateFlags({ ...flags, [key]: value });
    },
    [flags, updateFlags]
  );

  const applyPreset = useCallback(
    (presetId: FeaturePresetId) => {
      updateFlags(FEATURE_PRESETS[presetId].flags);
    },
    [updateFlags]
  );

  const resetDefaults = useCallback(() => {
    updateFlags(DEFAULT_FEATURE_FLAGS);
  }, [updateFlags]);

  return useMemo(
    () => ({
      flags,
      setFeatureFlag,
      applyPreset,
      resetDefaults,
    }),
    [flags, setFeatureFlag, applyPreset, resetDefaults]
  );
}
