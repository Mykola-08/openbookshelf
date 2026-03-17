"use client";

import { useMemo, useEffect, useState } from "react";
import Link from "next/link";
import { RotateCcw, WandSparkles, User, Settings2, Palette, Puzzle, Cpu, Compass, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/utils/supabase/client";

import {
  FEATURE_LABELS,
  FEATURE_PRESETS,
  ONBOARDING_DONE_KEY,
  getFeatureModeLabel,
  type FeatureFlagKey,
  type FeaturePresetId,
} from "@/lib/config/feature-flags";
import { USER_SETTING_PRESETS, type UserSettingPresetId } from "@/lib/config/user-settings";
import { useFeatureFlags } from "@/lib/hooks/use-feature-flags";
import { useUserSettings } from "@/lib/hooks/use-user-settings";
import { openOnboardingDialog } from "@/components/OnboardingDialog";
import { deployment } from "@/lib/config/deployment";
import { getDatabaseRuntimeInfo } from "@/lib/config/database";
import { BUILTIN_MODULES } from "@/lib/config/modules";
import { useModules } from "@/lib/hooks/use-modules";
import { cn } from "@/lib/utils";


const SectionCard = ({ children, title, description, badge }: any) => (
  <Card className="mb-6 border-border/40 shadow-none bg-card/50">
    <CardHeader className="flex flex-row items-center justify-between pb-3">
      <div className="space-y-0.5">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {description && <CardDescription className="text-[13px]">{description}</CardDescription>}
      </div>
      {badge && <Badge variant="secondary" className="font-normal text-[11px]">{badge}</Badge>}
    </CardHeader>
    <CardContent className="pt-0">
      {children}
    </CardContent>
  </Card>
);

const ListItem = ({ children, isLast, title, description, action }: any) => (
  <div className={cn("flex items-center justify-between gap-4 py-3", !isLast && "border-b border-border/30")}>
    <div className="flex-1 space-y-0.5">
      <p className="text-sm font-medium leading-none">{title}</p>
      {description && <p className="text-[13px] text-muted-foreground">{description}</p>}
      {children && <div className="mt-3">{children}</div>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export default function SettingsPage() {
  const { flags, setFeatureFlag, applyPreset: applyFeaturePreset, resetDefaults } = useFeatureFlags();
  const { moduleState } = useModules();
  const { settings, setSetting, applyPreset: applyUserPreset, resetSettings, saveState } = useUserSettings({
    syncToDb: Boolean(moduleState.enabled.settings_sync),
  });

  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState("member");

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (deployment.isSelfHosted && user) {
        const { data, error } = await supabase.rpc("bootstrap_user_role", { p_user_id: user.id });
        if (!error && typeof data === "string") {
          setRole(data);
        }
      }
    };
    fetchUser();
  }, []);

  const activeMode = useMemo(() => getFeatureModeLabel(flags), [flags]);
  const dbRuntime = useMemo(() => getDatabaseRuntimeInfo(), []);

  const toggleFlag = (key: FeatureFlagKey) => setFeatureFlag(key, !flags[key]);
  const handleApplyFeaturePreset = (id: FeaturePresetId) => applyFeaturePreset(id);
  const handleApplyUserPreset = (id: UserSettingPresetId) => applyUserPreset(id);
  const reopenOnboarding = () => { window.localStorage.removeItem(ONBOARDING_DONE_KEY); openOnboardingDialog(); };

  // Apple-like sections: large border-radius, pure white background on cards with subtle borders
  

  

  return (
    <main className="p-4 md:p-8 max-w-3xl mx-auto space-y-6 min-h-screen">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage your account, preferences, and modules.
          </p>
        </div>
        <div className="flex items-center text-xs font-medium">
          {saveState === 'saving' && <span className="text-muted-foreground animate-pulse flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin"/> Saving</span>}
          {saveState === 'saved' && <span className="text-primary flex items-center gap-1">✓ Saved</span>}
          {saveState === 'error' && <span className="text-destructive flex items-center gap-1">✕ Error</span>}
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6 w-full flex overflow-x-auto justify-start bg-muted/50 p-1 border border-border/30 rounded-xl">
          <TabsTrigger value="profile" className="rounded-lg px-3.5 text-[13px] data-[state=active]:shadow-sm"><User className="w-3.5 h-3.5 md:mr-1.5" /><span className="hidden md:inline">Profile</span></TabsTrigger>
          <TabsTrigger value="preferences" className="rounded-lg px-3.5 text-[13px] data-[state=active]:shadow-sm"><Settings2 className="w-3.5 h-3.5 md:mr-1.5" /><span className="hidden md:inline">Preferences</span></TabsTrigger>
          <TabsTrigger value="features" className="rounded-lg px-3.5 text-[13px] data-[state=active]:shadow-sm"><Cpu className="w-3.5 h-3.5 md:mr-1.5" /><span className="hidden md:inline">Features</span></TabsTrigger>
          <TabsTrigger value="visibility" className="rounded-lg px-3.5 text-[13px] data-[state=active]:shadow-sm"><Eye className="w-3.5 h-3.5 md:mr-1.5" /><span className="hidden md:inline">Visibility</span></TabsTrigger>
          <TabsTrigger value="theme" className="rounded-lg px-3.5 text-[13px] data-[state=active]:shadow-sm"><Palette className="w-3.5 h-3.5 md:mr-1.5" /><span className="hidden md:inline">Theme</span></TabsTrigger>
          {moduleState.enabled.merge_assistant && <TabsTrigger value="modules" className="rounded-lg px-3.5 text-[13px] data-[state=active]:shadow-sm"><Puzzle className="w-3.5 h-3.5 md:mr-1.5" /><span className="hidden md:inline">Advanced</span></TabsTrigger>}
          <TabsTrigger value="philosophy" className="rounded-lg px-3.5 text-[13px] data-[state=active]:shadow-sm" asChild>
            <Link href="/settings/philosophy">
              <Compass className="w-3.5 h-3.5 md:mr-1.5" />
              <span className="hidden md:inline">Philosophy</span>
            </Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="animate-in fade-in-50">
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
                    action={<Button variant="secondary" size="sm" className="rounded-lg" asChild><Link href="/settings">Open Modules</Link></Button>} 
                    isLast 
                  />
                )}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Database Runtime" description="Unified data layer with sensible defaults and provider compatibility.">
            <div className="flex flex-col">
              <ListItem title="Requested Provider" description={dbRuntime.requestedProvider} />
              <ListItem title="Resolved Provider" description={dbRuntime.providerLabel} />
              <ListItem title="Supabase Credentials" description={dbRuntime.hasSupabaseEnv ? "Configured" : "Missing"} />
              <ListItem title="Firebase Credentials" description={dbRuntime.hasFirebaseEnv ? "Configured" : "Missing"} isLast={!dbRuntime.fallbackReason} />
              {dbRuntime.fallbackReason && (
                <ListItem title="Compatibility Note" description={dbRuntime.fallbackReason} isLast />
              )}
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="preferences" className="animate-in fade-in-50">
          <SectionCard title="Experience Preset" description="Choose a pre-configured setup for your library experience.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
              {(Object.keys(USER_SETTING_PRESETS) as UserSettingPresetId[]).map((id) => (
                <button
                  key={id}
                  onClick={() => handleApplyUserPreset(id)}
                  className={cn(
                    "flex flex-col items-start gap-1 p-3 rounded-xl border transition-all text-left",
                    "hover:bg-accent/50 active:scale-[0.98]",
                    "border-border/50 bg-card"
                  )}
                >
                  <p className="text-sm font-semibold">{USER_SETTING_PRESETS[id].title}</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">{USER_SETTING_PRESETS[id].description}</p>
                </button>
              ))}
            </div>
          </SectionCard>

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
                    className="h-9 w-24 rounded-lg border border-input bg-background px-3 py-1 text-sm text-right focus:ring-2 focus:ring-primary focus:outline-none"
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
                    className="h-9 rounded-lg border border-input bg-background px-3 py-1 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
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
            <div className="p-4 bg-muted/30 border-t border-border/50 flex justify-end">
              <Button variant="outline" size="sm" onClick={resetSettings} className="rounded-lg">
                <RotateCcw className="w-4 h-4 mr-2" /> Reset
              </Button>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="features" className="animate-in fade-in-50">
          <SectionCard title="Quick Presets" description="Apply pre-configured feature flag bundles instantly.">
            <div className="p-2 flex flex-col sm:flex-row gap-2">
              {(Object.entries(FEATURE_PRESETS) as Array<[FeaturePresetId, { title: string; description: string }]>).map(([presetId, preset]) => (
                <button 
                  key={presetId} 
                  className="flex-1 text-left p-4 rounded-xl hover:bg-muted focus:bg-muted transition-colors focus:outline-none" 
                  onClick={() => handleApplyFeaturePreset(presetId)}
                >
                  <div className="font-medium text-[15px]">{preset.title}</div>
                  <div className="text-[13px] text-muted-foreground mt-1">{preset.description}</div>
                </button>
              ))}
            </div>
            <div className="p-4 bg-muted/30 border-t border-border/50 flex flex-wrap gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={resetDefaults} className="rounded-lg">
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={reopenOnboarding} className="rounded-lg">
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
        </TabsContent>

        <TabsContent value="visibility" className="animate-in fade-in-50">
          <SectionCard title="Feature Visibility" description="Show or hide individual features across the entire app. Disabled features are completely removed from the interface.">
            <div className="flex flex-col">
              {/* Navigation & Global UI */}
              <div className="px-1 pt-2 pb-1">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Navigation &amp; Global UI</p>
              </div>
              <ListItem
                title="Command Palette"
                description="Ctrl+K shortcut for quick navigation and global search."
                action={<Switch checked={settings.enableCommandPalette} onCheckedChange={(v) => setSetting("enableCommandPalette", v)} />}
              />
              <ListItem
                title="Scroll to Top"
                description="Floating button to scroll back to the top of long pages."
                action={<Switch checked={settings.enableScrollToTop} onCheckedChange={(v) => setSetting("enableScrollToTop", v)} />}
              />
              <ListItem
                title="Advanced Search"
                description="Advanced search dialog with extra filter options."
                action={<Switch checked={settings.enableAdvancedSearch} onCheckedChange={(v) => setSetting("enableAdvancedSearch", v)} />}
              />
              <ListItem
                title="Catalog Dropdown"
                description="Authors & Series dropdown in the navigation bar."
                action={<Switch checked={settings.enableCatalogDropdown} onCheckedChange={(v) => setSetting("enableCatalogDropdown", v)} />}
                isLast
              />

              {/* Library Features */}
              <div className="px-1 pt-6 pb-1">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Library</p>
              </div>
              <ListItem
                title="Matching Inbox"
                description="Import merge review inbox showing pending/conflicting books from sources."
                action={<Switch checked={settings.enableMatchingInbox} onCheckedChange={(v) => setSetting("enableMatchingInbox", v)} />}
              />
              <ListItem
                title="Bulk Actions"
                description="Multi-select mode for batch delete, move, or status change operations."
                action={<Switch checked={settings.enableBulkActions} onCheckedChange={(v) => setSetting("enableBulkActions", v)} />}
              />
              <ListItem
                title="Connections"
                description="External source connections management page."
                action={<Switch checked={settings.enableConnections} onCheckedChange={(v) => setSetting("enableConnections", v)} />}
                isLast
              />

              {/* Book Detail Features */}
              <div className="px-1 pt-6 pb-1">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Book Detail Page</p>
              </div>
              <ListItem
                title="Book Health Panel"
                description="Warning cards showing missing metadata (cover, description, ISBN, genres)."
                action={<Switch checked={settings.enableBookHealth} onCheckedChange={(v) => setSetting("enableBookHealth", v)} />}
              />
              <ListItem
                title="Reading Timeline"
                description="Visual timeline of reading status changes, progress milestones, and dates."
                action={<Switch checked={settings.enableReadingTimeline} onCheckedChange={(v) => setSetting("enableReadingTimeline", v)} />}
              />
              <ListItem
                title="Source Provenance"
                description="Show which external sources a book was imported from and sync status."
                action={<Switch checked={settings.enableSourceProvenance} onCheckedChange={(v) => setSetting("enableSourceProvenance", v)} />}
              />
              <ListItem
                title="Book Summary"
                description="AI-generated summary card on book detail pages."
                action={<Switch checked={settings.enableBookSummary} onCheckedChange={(v) => setSetting("enableBookSummary", v)} />}
              />
              <ListItem
                title="Chapters"
                description="Chapter listing with progress indicators on book detail pages."
                action={<Switch checked={settings.enableChapters} onCheckedChange={(v) => setSetting("enableChapters", v)} />}
              />
              <ListItem
                title="Aliases"
                description="Alternate title tracking and alias voting on book detail pages."
                action={<Switch checked={settings.enableAliases} onCheckedChange={(v) => setSetting("enableAliases", v)} />}
              />
              <ListItem
                title="Copy Buttons"
                description="Copy ID, ISBN, and link buttons on book detail pages."
                action={<Switch checked={settings.enableCopyButtons} onCheckedChange={(v) => setSetting("enableCopyButtons", v)} />}
              />
              <ListItem
                title="Quick Actions Bar"
                description="Mobile bottom bar with Read, Rate, Tag, and Note actions."
                action={<Switch checked={settings.enableQuickActions} onCheckedChange={(v) => setSetting("enableQuickActions", v)} />}
                isLast
              />

              {/* Tracker Features */}
              <div className="px-1 pt-6 pb-1">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Tracker</p>
              </div>
              <ListItem
                title="Reading Insights"
                description="Stats cards showing reading velocity, streaks, and distribution on the tracker page."
                action={<Switch checked={settings.enableReadingInsights} onCheckedChange={(v) => setSetting("enableReadingInsights", v)} />}
                isLast
              />

              {/* Community Sub-features */}
              <div className="px-1 pt-6 pb-1">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Community</p>
              </div>
              <ListItem
                title="Community Hub"
                description="Community page with activity feed, reviews, and goals."
                action={<Switch checked={settings.enableCommunity} onCheckedChange={(v) => setSetting("enableCommunity", v)} />}
              />
              <ListItem
                title="Reviews"
                description="Book reviews within the community section."
                action={<Switch checked={settings.enableReviews} onCheckedChange={(v) => setSetting("enableReviews", v)} disabled={!settings.enableCommunity} />}
              />
              <ListItem
                title="Activity Feed"
                description="Real-time feed of community reading activity."
                action={<Switch checked={settings.enableActivityFeed} onCheckedChange={(v) => setSetting("enableActivityFeed", v)} disabled={!settings.enableCommunity} />}
              />
              <ListItem
                title="Reading Goals"
                description="Set and track reading goals within the community."
                action={<Switch checked={settings.enableGoals} onCheckedChange={(v) => setSetting("enableGoals", v)} disabled={!settings.enableCommunity} />}
              />
              <ListItem
                title="Tracking Quantity"
                description="Pages/words read metrics and velocity tracking."
                action={<Switch checked={settings.enableTrackingQuantity} onCheckedChange={(v) => setSetting("enableTrackingQuantity", v)} disabled={!settings.enableCommunity} />}
                isLast
              />
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="theme" className="animate-in fade-in-50">
          <SectionCard title="Theme Studio" description="Customize global application colors and appearance.">
            {moduleState.enabled.theme_studio ? (
              <div className="flex flex-col">
                <ListItem 
                  title="Brand Accent" 
                  action={
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] text-muted-foreground font-mono uppercase">{settings.themeAccent}</span>
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-border shrink-0">
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
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-border shrink-0">
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
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-border shrink-0">
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
        </TabsContent>

        {moduleState.enabled.merge_assistant && (
          <TabsContent value="modules" className="animate-in fade-in-50">
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
                      className="h-9 w-24 rounded-lg border border-input bg-background px-3 py-1 text-sm text-right focus:ring-2 focus:ring-primary focus:outline-none"
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
                      className="h-9 w-24 rounded-lg border border-input bg-background px-3 py-1 text-sm text-right focus:ring-2 focus:ring-primary focus:outline-none"
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
                      className="h-9 w-24 rounded-lg border border-input bg-background px-3 py-1 text-sm text-right focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  }
                  isLast
                />
              </div>
            </SectionCard>
          </TabsContent>
        )}
      </Tabs>
    </main>
  );
}
