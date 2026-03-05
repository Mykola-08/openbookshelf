"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { BUILTIN_MODULES } from "@/lib/config/modules";
import { useModules } from "@/lib/hooks/use-modules";
import { cn } from "@/lib/utils";
import Link from "next/link";

const SectionCard = ({ children, title, description, badge }: any) => (
  <Card className="mb-8 border-border/40 shadow-none">
    <CardHeader className="flex flex-row items-center justify-between pb-4">
      <div className="space-y-1.5">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </div>
      {badge && <div className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-md font-medium">{badge}</div>}
    </CardHeader>
    <CardContent className="space-y-6">
      {children}
    </CardContent>
  </Card>
);

const ListItem = ({ children, isLast, title, description, action }: any) => (
  <div className={cn("flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4")}>
    <div className="flex-1 space-y-1">
      <p className="text-sm font-medium leading-none">{title}</p>
      {description && <p className="text-[13px] text-muted-foreground">{description}</p>}
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
      <Link href="/settings" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"><ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Settings</Link>
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
                  <span className="text-[10px] uppercase tracking-wider bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md">{module.category}</span>
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
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Module name"
            className="flex-1"
          />
          <Input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Module description"
            className="flex-1"
          />
          <Button type="button" onClick={addCustomModule} className=" h-10 px-6">
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
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-md w-8 h-8"
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
