"use client";

import { useUserSettings } from "@/lib/hooks/use-user-settings";

export function DemoModeBanner({ reason }: { reason?: string }) {
  return (
    <div 
      className="fixed bottom-4 right-4 z-[100] flex items-center gap-2 bg-background/80 backdrop-blur-md border border-border/50 text-muted-foreground text-[10px] py-1 px-3 rounded-full shadow-sm hover:text-foreground transition-colors cursor-help"
      title={reason ? `Demo Mode Active: ${reason}` : "Demo Mode Active"}
    >
      <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
      Demo Mode
    </div>
  );
}
