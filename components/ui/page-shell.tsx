import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type PageWidth = "default" | "wide" | "narrow" | "prose";

const WIDTH_CLASSES: Record<PageWidth, string> = {
  default: "max-w-7xl", // /, /tracker, /search
  wide: "max-w-6xl",    // /discover
  narrow: "max-w-4xl",  // /setup, /faq
  prose: "max-w-3xl",   // /settings
};

interface PageShellProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Max content width. Defaults to `default` (max-w-7xl). */
  width?: PageWidth;
  /** Extra classes applied to the inner container (width + padding live here). */
  className?: string;
  /** Render the inner container as a different element (e.g. "main"). */
  as?: "div" | "main" | "section";
  children: React.ReactNode;
}

/**
 * Shared page shell for top-level routes. Provides `min-h-screen` background,
 * centered container, and consistent horizontal/vertical padding so all pages
 * share one visual shell.
 */
export function PageShell({
  width = "default",
  className,
  as: Inner = "div",
  children,
  ...props
}: PageShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <Inner
        className={cn(
          WIDTH_CLASSES[width],
          "mx-auto px-4 md:px-8 py-6 md:py-8",
          className
        )}
        {...props}
      >
        {children}
      </Inner>
    </div>
  );
}

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: LucideIcon;
  /** Optional right-aligned actions (buttons, status indicator, etc.). */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Standard page header: title + optional description + optional right-aligned
 * actions. Uses the canonical typography tokens from `app/globals.css` /
 * Shadcn theme (text-2xl semibold, muted description).
 */
export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
          {Icon ? <Icon className="w-6 h-6" aria-hidden="true" /> : null}
          {title}
        </h1>
        {description ? (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      ) : null}
    </div>
  );
}
