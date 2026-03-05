"use client";

import { useCallback, useMemo, useState } from "react";
import {
  MODULE_COOKIE_NAME,
  MODULE_STORAGE_KEY,
  DEFAULT_MODULE_STATE,
  parseModuleState,
  serializeModuleState,
  type CustomModule,
  type ModuleState,
} from "@/lib/config/modules";

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

const readInitialModuleState = (): ModuleState => {
  if (typeof window === "undefined") return DEFAULT_MODULE_STATE;

  const fromStorage = window.localStorage.getItem(MODULE_STORAGE_KEY);
  if (fromStorage) return parseModuleState(fromStorage);

  const fromCookie = readCookie(MODULE_COOKIE_NAME);
  if (fromCookie) return parseModuleState(fromCookie);

  return DEFAULT_MODULE_STATE;
};

export function useModules() {
  const [moduleState, setModuleState] = useState<ModuleState>(readInitialModuleState);

  const persist = useCallback((nextState: ModuleState) => {
    const serialized = serializeModuleState(nextState);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(MODULE_STORAGE_KEY, serialized);
    }
    writeCookie(MODULE_COOKIE_NAME, serialized, 365);
  }, []);

  const updateState = useCallback(
    (nextState: ModuleState) => {
      setModuleState(nextState);
      persist(nextState);
    },
    [persist]
  );

  const setModuleEnabled = useCallback(
    (moduleId: string, enabled: boolean) => {
      updateState({
        ...moduleState,
        enabled: {
          ...moduleState.enabled,
          [moduleId]: enabled,
        },
      });
    },
    [moduleState, updateState]
  );

  const createCustomModule = useCallback(
    (name: string, description: string) => {
      const id = `custom_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}_${Date.now()}`;
      const customModule: CustomModule = {
        id,
        name,
        description,
        enabled: true,
      };

      updateState({
        ...moduleState,
        enabled: {
          ...moduleState.enabled,
          [id]: true,
        },
        customModules: [...moduleState.customModules, customModule],
      });
    },
    [moduleState, updateState]
  );

  const removeCustomModule = useCallback(
    (moduleId: string) => {
      const nextEnabled = { ...moduleState.enabled };
      delete nextEnabled[moduleId];
      updateState({
        ...moduleState,
        enabled: nextEnabled,
        customModules: moduleState.customModules.filter((module) => module.id !== moduleId),
      });
    },
    [moduleState, updateState]
  );

  return useMemo(
    () => ({
      moduleState,
      setModuleEnabled,
      createCustomModule,
      removeCustomModule,
    }),
    [moduleState, setModuleEnabled, createCustomModule, removeCustomModule]
  );
}
