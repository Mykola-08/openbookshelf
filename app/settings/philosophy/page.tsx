"use client";

import { Compass, Sparkles, Layout, Zap, Heart, ShieldCheck, Microscope, Layers } from "lucide-react";

const PRINCIPLES = [
  {
    icon: Layout,
    title: "Minimalism by Default",
    description: "Interfaces should start small. Use only what you need. Complexity is a choice, not a mandate.",
  },
  {
    icon: Sparkles,
    title: "Hyper-Personalization",
    description: "Every reader is different. From font pairings to database schema, the system adapts to your unique workflow.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy and Ownership",
    description: "Your data belongs to you. We favor local storage, exportable formats, and self-hosted options whenever possible.",
  },
  {
    icon: Zap,
    title: "Performance over Polish",
    description: "A fast, ugly interface is better than a slow, beautiful one. We aim for both, but speed comes first.",
  },
  {
    icon: Layers,
    title: "Modular Complexity",
    description: "Advanced features are hidden behind modules. If you don't use community features or AI, they shouldn't cost you mental overhead.",
  },
  {
    icon: Heart,
    title: "Digital Garden, Not a Warehouse",
    description: "Your library should feel alive—cultivated over time, reflecting your growth as a reader and thinker.",
  }
];

export default function PhilosophyPage() {
  return (
    <main className="p-6 md:p-12 lg:px-24 max-w-4xl mx-auto min-h-screen">
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header Section */}
        <div className="space-y-4 text-left">
          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-accent text-accent-foreground text-2xl mb-6 shadow-sm border border-border/50">
            🌱
          </div>
          <h1 className="text-4xl font-bold tracking-tight lg:text-5xl text-foreground">
            The OpenBookshelf Way
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mt-4">
            We believe reading software should be as focus-oriented as the books themselves. 
            Here is the manifesto that guides our development.
          </p>
        </div>

        {/* Principles Section */}
        <div className="flex flex-col gap-6 mt-12 pt-8 border-t border-border/40">
          {PRINCIPLES.map((p, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border/30 group">
              <div className="shrink-0 mt-0.5">
                <p.icon className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-base text-foreground tracking-tight">
                  {p.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {p.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Callout Section */}
        <div className="mt-12 pt-12 pb-8">
          <div className="flex gap-4 p-5 rounded-xl bg-accent/30 border border-accent">
            <Compass className="w-6 h-6 text-foreground shrink-0 mt-1" />
            <div className="space-y-2">
              <div className="font-semibold text-foreground">Guiding Star</div>
              <blockquote className="text-base text-muted-foreground leading-relaxed">
                "A library is not a collection of books, but a collection of thoughts. 
                The software should never stand between a reader and those thoughts."
              </blockquote>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
