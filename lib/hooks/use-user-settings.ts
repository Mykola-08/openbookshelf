"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  DEFAULT_USER_SETTINGS,
  USER_SETTINGS_STORAGE_KEY,
  normalizeUserSettings,
  parseUserSettings,
  type UserSettings,
} from "@/lib/config/user-settings";

interface UseUserSettingsResult {
  settings: UserSettings;
  setSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
  replaceSettings: (next: Partial<UserSettings>) => void;
  resetSettings: () => void;
  saveState: "idle" | "saving" | "saved" | "error";
  saveError: string | null;
}

interface UseUserSettingsOptions {
  syncToDb?: boolean;
}

const persistLocalSettings = (settings: UserSettings) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USER_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
};

const readInitialSettings = (): UserSettings => {
  if (typeof window === "undefined") return DEFAULT_USER_SETTINGS;
  return parseUserSettings(window.localStorage.getItem(USER_SETTINGS_STORAGE_KEY));
};

/**
 * DB-backed user settings with local fallback.
 * - Reads from localStorage immediately for fast first paint.
 * - Hydrates from `user_settings` table when authenticated.
 * - Writes debounced updates to DB so settings sync across devices.
 */
export function useUserSettings(options?: UseUserSettingsOptions): UseUserSettingsResult {
  const syncToDb = options?.syncToDb ?? true;
  const [settings, setSettings] = useState<UserSettings>(readInitialSettings);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!syncToDb) return;
    let cancelled = false;
    const loadFromDb = async () => {
      const userResult = await supabase.auth.getUser();
      const user = userResult.data.user;
      if (!user) return;

      // Ensure parent profile row exists before querying user-specific settings.
      await supabase.from("profiles").upsert({ id: user.id }, { onConflict: "id" });

      const settingsResult = await supabase
        .from("user_settings")
        .select("settings")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled || settingsResult.error || !settingsResult.data?.settings) return;
      const merged = normalizeUserSettings(settingsResult.data.settings as Partial<UserSettings>);
      setSettings(merged);
      persistLocalSettings(merged);
    };

    void loadFromDb();
    return () => {
      cancelled = true;
    };
  }, [supabase, syncToDb]);

  const saveToDb = useCallback(
    async (nextSettings: UserSettings) => {
      setSaveState("saving");
      setSaveError(null);

      const userResult = await supabase.auth.getUser();
      const user = userResult.data.user;
      if (!user) {
        setSaveState("saved");
        return;
      }

      if (!syncToDb) {
        setSaveState("saved");
        return;
      }

      // Keep referential integrity with user_settings -> profiles.
      await supabase.from("profiles").upsert({ id: user.id }, { onConflict: "id" });

      const writeResult = await supabase.from("user_settings").upsert(
        {
          user_id: user.id,
          settings: nextSettings,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      if (writeResult.error) {
        setSaveState("error");
        setSaveError(writeResult.error.message);
        return;
      }

      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 1200);
    },
    [supabase, syncToDb]
  );

  const scheduleDbSave = useCallback(
    (nextSettings: UserSettings) => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
      saveTimeout.current = setTimeout(() => {
        void saveToDb(nextSettings);
      }, 500);
    },
    [saveToDb]
  );

  const replaceSettings = useCallback(
    (next: Partial<UserSettings>) => {
      const merged = normalizeUserSettings({ ...settings, ...next });
      setSettings(merged);
      persistLocalSettings(merged);
      scheduleDbSave(merged);
    },
    [scheduleDbSave, settings]
  );

  const setSetting = useCallback(
    <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
      replaceSettings({ [key]: value } as Partial<UserSettings>);
    },
    [replaceSettings]
  );

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_USER_SETTINGS);
    persistLocalSettings(DEFAULT_USER_SETTINGS);
    scheduleDbSave(DEFAULT_USER_SETTINGS);
  }, [scheduleDbSave]);

  return {
    settings,
    setSetting,
    replaceSettings,
    resetSettings,
    saveState,
    saveError,
  };
}
