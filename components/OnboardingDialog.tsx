"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Library, Cloud, BookOpen, Sparkles, Users, BarChart3, Settings, Zap, Shield, Wand2 } from "lucide-react";
import { Switch } from "./ui/switch";
import { useUserSettings } from "@/lib/hooks/use-user-settings";
import { USER_SETTING_PRESETS, type UserSettingPresetId } from "@/lib/config/user-settings";
import { cn } from "@/lib/utils";

export const ONBOARDING_DONE_KEY = "openbookshelf_onboarding_done";

export function openOnboardingDialog() {
  window.dispatchEvent(new Event('open-onboarding'));
}

const STEPS = [
  {
    icon: Library,
    title: "Your Personal Library",
    description: "Import books from OPDS catalogs, add them manually, or connect remote sources. Your collection, your way.",
  },
  {
    icon: Wand2,
    title: "Choose Your Path",
    description: "Select a setup that fits your reading style. Everything can be customized later.",
    isPreset: true,
  },
  {
    icon: BookOpen,
    title: "Read Beautifully",
    description: "Open EPUB books directly in the built-in reader with adjustable fonts, themes, and progress tracking.",
  },
  {
    icon: Cloud,
    title: "Connect Anywhere",
    description: "Link OPDS catalogs and remote libraries to discover and sync books across sources.",
  },
  {
    icon: Sparkles,
    title: "Modular Experience",
    description: "Hide features you don't use to keep things fast and focused. You can always change this later in Settings.",
    isChoice: true,
  },
];

export function OnboardingDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const { settings, setSetting, applyPreset } = useUserSettings();

  const [activePreset, setActivePreset] = useState<UserSettingPresetId>("balanced");

  useEffect(() => {
    const handleOpen = () => {
      setStep(0);
      setTimeout(() => setOpen(true), 0);
    };
    window.addEventListener('open-onboarding', handleOpen);
    
    // Check if first time
    if (typeof window !== 'undefined' && !localStorage.getItem(ONBOARDING_DONE_KEY)) {
      setTimeout(() => setOpen(true), 0);
    }

    return () => window.removeEventListener('open-onboarding', handleOpen);
  }, []);

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ONBOARDING_DONE_KEY, "true");
    }
    setOpen(false);
    setStep(0);
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Welcome to OpenBookshelf</DialogTitle>
          <DialogDescription>
            Your minimalist, hyper-personal reading environment.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 space-y-4">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-7 h-7 text-primary" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-foreground">{current.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{current.description}</p>
          </div>

          {(current as any).isPreset && (
            <div className="grid grid-cols-1 gap-3 max-w-sm mx-auto w-full">
              {(Object.keys(USER_SETTING_PRESETS) as UserSettingPresetId[]).map((id) => {
                const p = USER_SETTING_PRESETS[id];
                return (
                  <button
                    key={id}
                    onClick={() => {
                      setActivePreset(id);
                      applyPreset(id);
                    }}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all",
                      activePreset === id 
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20" 
                        : "border-border/50 hover:border-border bg-card"
                    )}
                  >
                    <div className={cn(
                      "mt-0.5 p-1.5 rounded-lg",
                      activePreset === id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {id === 'minimalist' && <Shield className="w-3.5 h-3.5" />}
                      {id === 'balanced' && <Sparkles className="w-3.5 h-3.5" />}
                      {id === 'power_reader' && <Zap className="w-3.5 h-3.5" />}
                      {id === 'writer' && <BookOpen className="w-3.5 h-3.5" />}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold leading-none">{p.title}</p>
                      <p className="text-xs text-muted-foreground leading-tight">{p.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {(current as any).isChoice && (
            <div className="bg-muted/30 rounded-xl p-4 space-y-4 max-w-sm mx-auto w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div className="space-y-0.5 text-left">
                    <p className="text-sm font-medium">Community Features</p>
                    <p className="text-xs text-muted-foreground">Reviews, voting, aliases</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.enableCommunity} 
                  onCheckedChange={(val) => {
                    setSetting("enableCommunity", val);
                    setSetting("enableReviews", val);
                  }} 
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <BarChart3 className="w-4 h-4 text-primary" />
                  </div>
                  <div className="space-y-0.5 text-left">
                    <p className="text-sm font-medium">Progress Tracking</p>
                    <p className="text-xs text-muted-foreground">Track numbers and velocity</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.enableTrackingQuantity} 
                  onCheckedChange={(val) => setSetting("enableTrackingQuantity", val)} 
                />
              </div>
            </div>
          )}

          {/* Step indicator dots */}
          <div className="flex justify-center gap-1.5 pt-2">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === step ? 'bg-primary w-6' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>
        </div>
        <DialogFooter className="flex-row justify-between sm:justify-between">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>Back</Button>
          ) : (
            <Button variant="ghost" onClick={handleClose}>Skip</Button>
          )}
          <Button onClick={handleNext}>
            {step < STEPS.length - 1 ? 'Next' : 'Get Started'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
