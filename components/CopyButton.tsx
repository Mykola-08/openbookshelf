"use client";

import { useState, useCallback } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  className?: string;
  label?: string;
}

export function CopyButton({ value, className, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [value]);

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors",
        className
      )}
      aria-label={copied ? "Copied" : `Copy ${label || "to clipboard"}`}
      title={copied ? "Copied!" : `Copy ${label || ""}`}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-foreground" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
      {label && <span>{copied ? "Copied!" : label}</span>}
    </button>
  );
}
