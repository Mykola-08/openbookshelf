"use client";

import { useEffect } from "react";
import { useUserSettings } from "@/lib/hooks/use-user-settings";

export function AppThemeRuntime() {
  const { settings } = useUserSettings();

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === "dark") {
      root.classList.add("dark");
    } else if (settings.theme === "light") {
      root.classList.remove("dark");
    } else {
      // System
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, [settings.theme]);

  return null;
}
