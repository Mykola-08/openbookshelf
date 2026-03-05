import sys

content = """'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { 
  User, Settings2, Palette, Puzzle, Cpu, Globe, Target, Activity, 
  MessageSquare, Star, RotateCcw, WandSparkles
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@/utils/supabase/client';

import {
  FEATURE_LABELS,
  FEATURE_PRESETS,
  ONBOARDING_DONE_KEY,
  getFeatureModeLabel,
  type FeatureFlagKey,
  type FeaturePresetId,
} from '@/lib/config/feature-flags';
import { useFeatureFlags } from '@/lib/hooks/use-feature-flags';
import { useUserSettings } from '@/lib/hooks/use-user-settings';
import { openOnboardingDialog } from '@/components/OnboardingDialog';
import { deployment } from '@/lib/config/deployment';
import { useModules } from '@/lib/hooks/use-modules';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { flags, setFeatureFlag, applyPreset, resetDefaults } = useFeatureFlags();
  const { moduleState } = useModules();
  const { settings, setSetting, resetSettings } = useUserSettings({
    syncToDb: Boolean(moduleState.enabled.settings_sync),
  });

  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState('member');
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (deployment.isSelfHosted && user) {
        const { data, error } = await supabase.rpc('bootstrap_user_role', { p_user_id: user.id });
        if (!error && typeof data === 'string') {
          setRole(data);
        }
      }
    };
    fetchUser();
  }, []);

  const activeMode = useMemo(() => getFeatureModeLabel(flags), [flags]);
  const toggleFlag = (key: FeatureFlagKey) => setFeatureFlag(key, !flags[key]);
  const reopenOnboarding = () => { window.localStorage.removeItem(ONBOARDING_DONE_KEY); openOnboardingDialog(); };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Settings2 },
    { id: 'features', label: 'Features', icon: Cpu },
    { id: 'community', label: 'Community', icon: Globe },
    { id: 'theme', label: 'Appearance', icon: Palette },
    ...(moduleState.enabled.merge_assistant ? [{ id: 'modules', label: 'Advanced', icon: Puzzle }] : [])
  ];

  const SectionCard = ({ children, title, description, badge }: any) => (
    <Card className="mb-6 border-border/40 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="space-y-1.5">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {description && <CardDescription className="text-[14px]">{description}</CardDescription>}
        </div>
        {badge && <div className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-md font-medium">{badge}</div>}
      </CardHeader>
      <CardContent className="space-y-6">
        {children}
      </CardContent>
    </Card>
  );

  const ListItem = ({ children, isLast, title, description, action }: any) => (
    <div className={cn("flex items-center justify-between gap-4 py-1", !isLast && "border-b border-border/50 pb-4 mb-4")}>
      <div className="flex-1 space-y-1.5">
        <p className="text-[15px] font-medium leading-none">{title}</p>
        {description && <p className="text-[14px] text-muted-foreground">{description}</p>}
        {children && <div className="mt-3">{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );

  return (
    <main className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground text-[15px] mt-1">
          Manage your account, preferences, and module integrations.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0 overflow-x-auto md:overflow-visible">
          <nav className="flex md:flex-col gap-1 pb-2 md:pb-0 md:sticky md:top-24">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap md:whitespace-normal text-left",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <section className="flex-1 min-w-0 w-full">
          {activeTab === 'profile' && (
            <div className="animate-in fade-in-50 duration-300">
              <SectionCard title="Account Information" description="Your personal account details and system role.">
                {!user ? (
                  <div className="p-6 text-sm text-center text-muted-foreground">Loading user profile...</div>
                ) : (
                  <div className="flex flex-col">
                    <ListItem title="User ID" description={<span className="font-mono text-xs">{user.id}</span>} />
                    <ListItem title="Email" description={user.email || "Unavailable"} />
                    <ListItem title="System Role" description={<span className="capitalize">{deployment.isSelfHosted ? role : "cloud_user"}</span>} isLast={!(deployment.isSelfHosted && role === "admin")} />
                    {deployment.isSelfHosted && role === "admin" && (
                      <ListItem
                        title="Admin Actions"
                        action={<Button variant="secondary" className="rounded-md" asChild><Link href="/settings">Open Modules</Link></Button>}
                        isLast
                      />
                    )}
                  </div>
                )}
              </SectionCard>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="animate-in fade-in-50 duration-300">
              <SectionCard title="Reader & Summaries" badge={moduleState.enabled.settings_sync ? 'State Synced' : 'Local Only'}>
                <div className="flex flex-col">
                  <ListItem
                    title="Cache Limit"
                    description="Maximum offline storage capacity in MB."
                    action={
                      <input
                        type="number" min={50} max={2000}
                        value={settings.cacheLimitMb}
                        onChange={(e) => setSetting("cacheLimitMb", Number(e.target.value))}
                        className="h-9 w-24 rounded-lg border border-input bg-background px-3 py-1 text-sm text-right focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    }
                  />
                  <ListItem
                    title="Summary Depth"
                    description="Detail level for AI-generated summaries."
                    action={
                      <select
                        value={settings.summaryDepth}
                        onChange={(e) => setSetting("summaryDepth", e.target.value as any)}
                        className="h-9 rounded-lg border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="short">Short</option>
                        <option value="balanced">Balanced</option>
                        <option value="deep">Deep</option>
                      </select>
                    }
                  />
                  <ListItem
                    title="Chapter Prefetch"
                    description="Automatically load next chapters in background."
                    action={
                      <Switch
                        checked={settings.autoPrefetch}
                        onCheckedChange={(checked) => setSetting("autoPrefetch", checked)}
                      />
                    }
                    isLast
                  />
                </div>
                <div className="pt-4 mt-2 flex justify-end">
                  <Button variant="outline" onClick={resetSettings} className="rounded-md">
                    <RotateCcw className="w-4 h-4 mr-2" /> Reset
                  </Button>
                </div>
              </SectionCard>
            </div>
          )}

          {activeTab === 'features' && (
            <div className="animate-in fade-in-50 duration-300">
              <SectionCard title="Quick Presets" description="Apply pre-configured feature flag bundles instantly.">
                <div className="p-2 flex flex-col sm:flex-row gap-2">
                  {(Object.entries(FEATURE_PRESETS) as Array<[FeaturePresetId, { title: string; description: string }]>).map(([presetId, preset]) => (
                    <button
                      key={presetId}
                      className="flex-1 text-left p-4 rounded-lg hover:bg-muted focus:bg-muted transition-colors focus:outline-none border border-border/50"
                      onClick={() => applyPreset(presetId)}
                    >
                      <div className="font-medium text-[15px]">{preset.title}</div>
                      <div className="text-[13px] text-muted-foreground mt-1">{preset.description}</div>
                    </button>
                  ))}
                </div>
                <div className="pt-4 mt-2 flex flex-wrap gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={resetDefaults} className="rounded-md">
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset
                  </Button>
                  <Button type="button" variant="secondary" onClick={reopenOnboarding} className="rounded-md">
                    <WandSparkles className="w-3.5 h-3.5 mr-1.5" /> Onboarding
                  </Button>
                </div>
              </SectionCard>

              <SectionCard title="Feature Activation" description="Enable or disable core application flags individually." badge={activeMode}>
                <div className="flex flex-col">
                  {(Object.entries(FEATURE_LABELS) as Array<[FeatureFlagKey, { title: string; description: string }]>).map(
                    ([key, meta], idx, arr) => (
                      <ListItem
                        key={key}
                        title={meta.title}
                        description={meta.description}
                        action={
                          <Switch
                            checked={flags[key]}
                            onCheckedChange={() => toggleFlag(key)}
                          />
                        }
                        isLast={idx === arr.length - 1}
                      />
                    )
                  )}
                </div>
              </SectionCard>
            </div>
          )}

          {activeTab === 'community' && (
            <div className="animate-in fade-in-50 duration-300">
               <SectionCard title="Social & Community" description="Control social features, reviews, and how you interact with others." badge="New">
                  <div className="flex flex-col">
                    <ListItem
                      title={
                        <span className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-primary" /> Community Features Core
                        </span>
                      }
                      description="Enable the global community features like friends, following, and shared bookshelves. Disabling this hides all social functionality."
                      action={
                        <Switch
                          checked={settings.enableCommunity ?? true}
                          onCheckedChange={(checked) => setSetting("enableCommunity", checked)}
                        />
                      }
                    />
                    <ListItem
                      title={
                        <span className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-indigo-500" /> Activity Feed
                        </span>
                      }
                      description="Show what your friends are reading, reviewing, and tracking in an activity timeline."
                      action={
                        <Switch
                          checked={settings.enableActivityFeed ?? true}
                          disabled={!(settings.enableCommunity ?? true)}
                          onCheckedChange={(checked) => setSetting("enableActivityFeed", checked)}
                        />
                      }
                    />
                    <ListItem
                      title={
                        <span className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-500" /> Reviews & Ratings
                        </span>
                      }
                      description="Allow creating and reading reviews or 5-star ratings for books."
                      action={
                        <Switch
                          checked={settings.enableReviews ?? true}
                          disabled={!(settings.enableCommunity ?? true)}
                          onCheckedChange={(checked) => setSetting("enableReviews", checked)}
                        />
                      }
                    />
                    <ListItem
                      title={
                        <span className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-emerald-500" /> Reading Goals
                        </span>
                      }
                      description="Setup and display yearly reading challenges on your profile."
                      action={
                        <Switch
                          checked={settings.enableGoals ?? true}
                          disabled={!(settings.enableCommunity ?? true)}
                          onCheckedChange={(checked) => setSetting("enableGoals", checked)}
                        />
                      }
                      isLast
                    />
                  </div>
               </SectionCard>
            </div>
          )}

          {activeTab === 'theme' && (
            <div className="animate-in fade-in-50 duration-300">
              <SectionCard title="Theme Studio" description="Customize global application colors and appearance.">
                {moduleState.enabled.theme_studio ? (
                  <div className="flex flex-col">
                    <ListItem
                      title="Brand Accent"
                      action={
                        <div className="flex items-center gap-3">
                          <span className="text-[13px] text-muted-foreground font-mono uppercase">{settings.themeAccent}</span>
                          <div className="w-8 h-8 rounded-md overflow-hidden border border-border shrink-0">
                            <input type="color" value={settings.themeAccent} onChange={(e) => setSetting("themeAccent", e.target.value)} className="w-12 h-12 -translate-x-2 -translate-y-2 cursor-pointer" />
                          </div>
                        </div>
                      }
                    />
                    <ListItem
                      title="Surface A"
                      action={
                        <div className="flex items-center gap-3">
                          <span className="text-[13px] text-muted-foreground font-mono uppercase">{settings.surfaceAccentA}</span>
                          <div className="w-8 h-8 rounded-md overflow-hidden border border-border shrink-0">
                            <input type="color" value={settings.surfaceAccentA} onChange={(e) => setSetting("surfaceAccentA", e.target.value)} className="w-12 h-12 -translate-x-2 -translate-y-2 cursor-pointer" />
                          </div>
                        </div>
                      }
                    />
                    <ListItem
                      title="Surface B"
                      action={
                        <div className="flex items-center gap-3">
                          <span className="text-[13px] text-muted-foreground font-mono uppercase">{settings.surfaceAccentB}</span>
                          <div className="w-8 h-8 rounded-md overflow-hidden border border-border shrink-0">
                            <input type="color" value={settings.surfaceAccentB} onChange={(e) => setSetting("surfaceAccentB", e.target.value)} className="w-12 h-12 -translate-x-2 -translate-y-2 cursor-pointer" />
                          </div>
                        </div>
                      }
                      isLast
                    />
                  </div>
                ) : (
                  <div className="p-8 text-sm text-muted-foreground text-center">
                    Theme Studio module is disabled. Application uses standard default styling.
                  </div>
                )}
              </SectionCard>
            </div>
          )}

          {activeTab === 'modules' && moduleState.enabled.merge_assistant && (
            <div className="animate-in fade-in-50 duration-300">
              <SectionCard title="Import & Alias Rules" description="Configure thresholds for automated conflict resolution.">
                <div className="flex flex-col">
                  <ListItem
                    title="Auto-merge Threshold"
                    description="Minimum similarity to auto-merge incoming books."
                    action={
                      <input
                        type="number" min={0.5} max={0.99} step={0.01}
                        value={settings.mergeSimilarityThreshold}
                        onChange={(e) => setSetting("mergeSimilarityThreshold", Number(e.target.value))}
                        className="h-9 w-24 rounded-lg border border-input bg-background px-3 py-1 text-sm text-right focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    }
                  />
                  <ListItem
                    title="Review Threshold"
                    description="Minimum similarity to queue items for manual merge review."
                    action={
                      <input
                        type="number" min={0.4} max={0.95} step={0.01}
                        value={settings.mergeReviewThreshold}
                        onChange={(e) => setSetting("mergeReviewThreshold", Number(e.target.value))}
                        className="h-9 w-24 rounded-lg border border-input bg-background px-3 py-1 text-sm text-right focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    }
                  />
                  <ListItem
                    title="Alias Quorum" 
                    description="Votes needed to auto-approve community aliases." 
                    action={
                      <input
                        type="number" min={2} max={10} step={1}
                        value={settings.aliasVoteQuorum}
                        onChange={(e) => setSetting("aliasVoteQuorum", Number(e.target.value))}
                        className="h-9 w-24 rounded-lg border border-input bg-background px-3 py-1 text-sm text-right focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    }
                    isLast
                  />
                </div>
              </SectionCard>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
"""

with open('app/settings/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated app/settings/page.tsx")
