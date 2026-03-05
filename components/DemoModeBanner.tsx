"use client";

import { useUserSettings } from "@/lib/hooks/use-user-settings";

export function DemoModeBanner({ reason }: { reason?: string }) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs py-1.5 px-4 text-center font-medium fixed top-0 w-full z-[100] flex justify-center items-center gap-2 shadow-sm">
      <span className="flex h-2 w-2 rounded-full bg-blue-300 animate-pulse"></span>
      Demo Mode is Active — Data syncs locally
    </div>
  );
}
