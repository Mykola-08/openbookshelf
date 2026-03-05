"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { BUILTIN_MODULES } from "@/lib/config/modules";
import { useModules } from "@/lib/hooks/use-modules";
import { cn } from "@/lib/utils";

// Apple-like sections: large border-radius, pure white background on cards with subtle borders
const SectionCard = ({ children, title, description, badge }: any) => (
  <div className="mb-8">
    <div className="px-4 mb-2 flex justify-between items-end">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {badge && <div className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full font-medium">{badge}</div>}
    </div>
    <div className="bg-card border border-border shadow-sm rounded-[1.5rem] overflow-hidden">
      {children}
    </div>
  </div>
);

const ListItem = ({ children, isLast, title, description, action }: any) => (
  <div className={cn("p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4", !isLast && "border-b border-border/50")}>
    <div className="flex-1">
      <div className="font-medium text-[15px]">{title}</div>
      {description && <div className="text-[13px] text-muted-foreground mt-0.5 leading-snug">{description}</div>}
      {children && <div className="mt-3">{children}</div>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export function ModulesMarketplace() {
  const { moduleState, setModuleEnabled, createCustomModule, removeCustomModule } = useModules();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const enabledBuiltinCount = useMemo(
    () => BUILTIN_MODULES.filter((module) => moduleState.enabled[module.id]).length,
    [moduleState.enabled]
  );

  const addCustomModule = () => {
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    if (!trimmedName || !trimmedDescription) return;
    createCustomModule(trimmedName, trimmedDescription);
    setName("");
    setDescription("");
  };

  return (
    <main className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 min-h-screen">
      <div className="space-y-1 mb-8 px-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Modules Marketplace</h1>
        <p className="text-muted-foreground text-[15px]">
          Enable, disable, and compose modules for your self-hosted instance.
        </p>
      </div>

      <SectionCard 
        title="Builtin Modules" 
        description="Core features and integrations shipped with the application."
        badge={`${enabledBuiltinCount}/${BUILTIN_MODULES.length} Enabled`}
      >
        <div className="flex flex-col">
          {BUILTIN_MODULES.map((module, idx) => (
            <ListItem
              key={module.id}
              title={
                <div className="flex items-center gap-2">
                  <span>{module.title}</span>
                  <span className="text-[10px] uppercase tracking-wider bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">{module.category}</span>
                </div>
              }
              description={module.description}
              action={
                <Switch 
                  checked={moduleState.enabled[module.id]}
                  onCheckedChange={(checked) => setModuleEnabled(module.id, checked)}
                />
              }
              isLast={idx === BUILTIN_MODULES.length - 1}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard 
        title="Custom Modules" 
        description="Add your own custom feature flags and integrations."
      >
        <div className="p-4 flex flex-col sm:flex-row gap-3 border-b border-border/50 bg-muted/10">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Module name"
            className="flex-1 h-10 rounded-xl border border-input bg-background px-4 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
          />
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Module description"
            className="flex-1 h-10 rounded-xl border border-input bg-background px-4 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
          />
          <Button type="button" onClick={addCustomModule} className="rounded-xl h-10 px-6">
            <Plus className="w-4 h-4 mr-1.5" /> Add
          </Button>
        </div>

        <div className="flex flex-col">
          {moduleState.customModules.length === 0 ? (
            <div className="p-8 text-sm text-center text-muted-foreground">No custom modules yet.</div>
          ) : (
            moduleState.customModules.map((module, idx) => (
              <ListItem
                key={module.id}
                title={module.name}
                description={module.description}
                action={
                  <div className="flex items-center gap-4">
                    <Switch 
                      checked={moduleState.enabled[module.id]}
                      onCheckedChange={(checked) => setModuleEnabled(module.id, checked)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full w-8 h-8"
                      onClick={() => removeCustomModule(module.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="sr-only">Remove module</span>
                    </Button>
                  </div>
                }
                isLast={idx === moduleState.customModules.length - 1}
              />
            ))
          )}
        </div>
      </SectionCard>
    </main>
  );
}
