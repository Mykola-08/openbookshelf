import sys

content = """\"use client\";

import { useMemo, useEffect, useState } from \"react\";
import Link from \"next/link\";
import { RotateCcw, WandSparkles, User, Settings2, Palette, Puzzle, Cpu } from \"lucide-react\";
import { Button } from \"@/components/ui/button\";
import { Switch } from \"@/components/ui/switch\";
import { Tabs, TabsContent, TabsList, TabsTrigger } from \"@/components/ui/tabs\";
import { createClient } from \"@/utils/supabase/client\";

import {
  FEATURE_LABELS,
  FEATURE_PRESETS,
  ONBOARDING_DONE_KEY,
  getFeatureModeLabel,
  type FeatureFlagKey,
  type FeaturePresetId,
} from \"@/lib/config/feature-flags\";
import { useFeatureFlags } from \"@/lib/hooks/use-feature-flags\";
import { useUserSettings } from \"@/lib/hooks/use-user-settings\";
import { openOnboardingDialog } from \"@/components/OnboardingDialog\";
import { deployment } from \"@/lib/config/deployment\";
import { BUILTIN_MODULES } from \"@/lib/config/modules\";
import { useModules } from \"@/lib/hooks/use-modules\";
import { cn } from \"@/lib/utils\";

export default function SettingsPage() {
  const { flags, setFeatureFlag, applyPreset, resetDefaults } = useFeatureFlags();
  const { moduleState } = useModules();
  const { settings, setSetting, resetSettings } = useUserSettings({
    syncToDb: Boolean(moduleState.enabled.settings_sync),
  });

  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState(\"member\");

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (deployment.isSelfHosted && user) {
        const { data, error } = await supabase.rpc(\"bootstrap_user_role\", { p_user_id: user.id });
        if (!error && typeof data === \"string\") {
          setRole(data);
        }
      }
    };
    fetchUser();
  }, []);

  const activeMode = useMemo(() => getFeatureModeLabel(flags), [flags]);

  const toggleFlag = (key: FeatureFlagKey) => setFeatureFlag(key, !flags[key]);
  const reopenOnboarding = () => { window.localStorage.removeItem(ONBOARDING_DONE_KEY); openOnboardingDialog(); };

  // Apple-like sections: large border-radius, pure white background on cards with subtle borders
  const SectionCard = ({ children, title, description, badge }: any) => (
    <div className=\"mb-8\">
      <div className=\"px-4 mb-2 flex justify-between items-end\">
        <div>
          <h2 className=\"text-xl font-semibold tracking-tight text-foreground\">{title}</h2>
          {description && <p className=\"text-sm text-muted-foreground mt-1\">{description}</p>}
        </div>
        {badge && <div className=\"text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full font-medium\">{badge}</div>}
      </div>
      <div className=\"bg-card border border-border shadow-sm rounded-[1.5rem] overflow-hidden\">
        {children}
      </div>
    </div>
  );

  const ListItem = ({ children, isLast, title, description, action }: any) => (
    <div className={cn(\"p-4 flex items-center justify-between\", !isLast && \"border-b border-border/50\")}>
      <div className=\"pr-4 flex-1\">
        <div className=\"font-medium text-[15px]\">{title}</div>
        {description && <div className=\"text-[13px] text-muted-foreground mt-0.5 leading-snug\">{description}</div>}
        {children && <div className=\"mt-3\">{children}</div>}
      </div>
      {action && <div className=\"ml-4 shrink-0\">{action}</div>}
    </div>
  );

  return (
    <main className=\"p-4 md:p-8 max-w-3xl mx-auto space-y-6 min-h-screen\">
      <div className=\"space-y-1 mb-8 px-2\">
        <h1 className=\"text-3xl font-bold tracking-tight text-foreground\">Settings</h1>
        <p className=\"text-muted-foreground text-[15px]\">
          Manage your account, preferences, and module integrations.
        </p>
      </div>

      <Tabs defaultValue=\"profile\" className=\"w-full\">
        <TabsList className=\"mb-6 w-full flex overflow-x-auto justify-start bg-muted p-1 border-none rounded-full\">
          <TabsTrigger value=\"profile\" className=\"rounded-full px-4\"><User className=\"w-4 h-4 md:mr-2\" /><span className=\"hidden md:inline\">Profile</span></TabsTrigger>
          <TabsTrigger value=\"preferences\" className=\"rounded-full px-4\"><Settings2 className=\"w-4 h-4 md:mr-2\" /><span className=\"hidden md:inline\">Preferences</span></TabsTrigger>
          <TabsTrigger value=\"features\" className=\"rounded-full px-4\"><Cpu className=\"w-4 h-4 md:mr-2\" /><span className=\"hidden md:inline\">Features</span></TabsTrigger>
          <TabsTrigger value=\"theme\" className=\"rounded-full px-4\"><Palette className=\"w-4 h-4 md:mr-2\" /><span className=\"hidden md:inline\">Theme</span></TabsTrigger>
          {moduleState.enabled.merge_assistant && <TabsTrigger value=\"modules\" className=\"rounded-full px-4\"><Puzzle className=\"w-4 h-4 md:mr-2\" /><span className=\"hidden md:inline\">Advanced</span></TabsTrigger>}
        </TabsList>

        <TabsContent value=\"profile\" className=\"animate-in fade-in-50\">
          <SectionCard title=\"Account Information\" description=\"Your personal account details and system role.\">
            {!user ? (
              <div className=\"p-6 text-sm text-center text-muted-foreground\">Loading user profile...</div>
            ) : (
              <div className=\"flex flex-col\">
                <ListItem title=\"User ID\" description={<span className=\"font-mono text-xs\">{user.id}</span>} />
                <ListItem title=\"Email\" description={user.email || \"Unavailable\"} />
                <ListItem title=\"System Role\" description={<span className=\"capitalize\">{deployment.isSelfHosted ? role : \"cloud_user\"}</span>} isLast={!(deployment.isSelfHosted && role === \"admin\")} />
                {deployment.isSelfHosted && role === \"admin\" && (
                  <ListItem 
                    title=\"Admin Actions\" 
                    action={<Button variant=\"secondary\" className=\"rounded-full\" asChild><Link href=\"/settings\">Open Modules</Link></Button>} 
                    isLast 
                  />
                )}
              </div>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value=\"preferences\" className=\"animate-in fade-in-50\">
          <SectionCard title=\"Reader & Summaries\" badge={moduleState.enabled.settings_sync ? 'State Synced' : 'Local Only'}>
            <div className=\"flex flex-col\">
              <ListItem 
                title=\"Cache Limit\" 
                description=\"Maximum offline storage capacity in MB.\"
                action={
                  <input
                    type=\"number\" min={50} max={2000}
                    value={settings.cacheLimitMb}
                    onChange={(e) => setSetting(\"cacheLimitMb\", Number(e.target.value))}
                    className=\"h-9 w-24 rounded-lg border border-input bg-background px-3 py-1 text-sm text-right focus:ring-2 focus:ring-primary focus:outline-none\"
                  />
                }
              />
              <ListItem 
                title=\"Summary Depth\" 
                description=\"Detail level for AI-generated summaries.\"
                action={
                  <select
                    value={settings.summaryDepth}
                    onChange={(e) => setSetting(\"summaryDepth\", e.target.value)}
                    className=\"h-9 rounded-lg border border-input bg-background px-3 py-1 text-sm focus:ring-2 focus:ring-primary focus:outline-none\"
                  >
                    <option value=\"short\">Short</option>
                    <option value=\"balanced\">Balanced</option>
                    <option value=\"deep\">Deep</option>
                  </select>
                }
              />
              <ListItem 
                title=\"Chapter Prefetch\" 
                description=\"Automatically load next chapters in background.\"
                action={
                  <Switch 
                    checked={settings.autoPrefetch}
                    onCheckedChange={(checked) => setSetting(\"autoPrefetch\", checked)}
                  />
                }
                isLast
              />
            </div>
            <div className=\"p-4 bg-muted/30 border-t border-border/50 flex justify-end\">
              <Button variant=\"outline\" onClick={resetSettings} className=\"rounded-full\">
                <RotateCcw className=\"w-4 h-4 mr-2\" /> Reset
              </Button>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value=\"features\" className=\"animate-in fade-in-50\">
          <SectionCard title=\"Quick Presets\" description=\"Apply pre-configured feature flag bundles instantly.\">
            <div className=\"p-2 flex flex-col sm:flex-row gap-2\">
              {(Object.entries(FEATURE_PRESETS) as Array<[FeaturePresetId, { title: string; description: string }]>).map(([presetId, preset]) => (
                <button 
                  key={presetId} 
                  className=\"flex-1 text-left p-4 rounded-xl hover:bg-muted focus:bg-muted transition-colors focus:outline-none\" 
                  onClick={() => applyPreset(presetId)}
                >
                  <div className=\"font-medium text-[15px]\">{preset.title}</div>
                  <div className=\"text-[13px] text-muted-foreground mt-1\">{preset.description}</div>
                </button>
              ))}
            </div>
            <div className=\"p-4 bg-muted/30 border-t border-border/50 flex flex-wrap gap-2 justify-end\">
              <Button type=\"button\" variant=\"outline\" onClick={resetDefaults} className=\"rounded-full\">
                <RotateCcw className=\"w-3.5 h-3.5 mr-1.5\" /> Reset
              </Button>
              <Button type=\"button\" variant=\"secondary\" onClick={reopenOnboarding} className=\"rounded-full\">
                <WandSparkles className=\"w-3.5 h-3.5 mr-1.5\" /> Onboarding
              </Button>
            </div>
          </SectionCard>

          <SectionCard title=\"Feature Activation\" description=\"Enable or disable core application flags individually.\" badge={activeMode}>
            <div className=\"flex flex-col\">
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

        <TabsContent value=\"theme\" className=\"animate-in fade-in-50\">
          <SectionCard title=\"Theme Studio\" description=\"Customize global application colors and appearance.\">
            {moduleState.enabled.theme_studio ? (
              <div className=\"flex flex-col\">
                <ListItem 
                  title=\"Brand Accent\" 
                  action={
                    <div className=\"flex items-center gap-3\">
                      <span className=\"text-[13px] text-muted-foreground font-mono uppercase\">{settings.themeAccent}</span>
                      <div className=\"w-8 h-8 rounded-full overflow-hidden border border-border shrink-0\">
                        <input type=\"color\" value={settings.themeAccent} onChange={(e) => setSetting(\"themeAccent\", e.target.value)} className=\"w-12 h-12 -translate-x-2 -translate-y-2 cursor-pointer\" />
                      </div>
                    </div>
                  }
                />
                <ListItem 
                  title=\"Surface A\" 
                  action={
                    <div className=\"flex items-center gap-3\">
                      <span className=\"text-[13px] text-muted-foreground font-mono uppercase\">{settings.surfaceAccentA}</span>
                      <div className=\"w-8 h-8 rounded-full overflow-hidden border border-border shrink-0\">
                        <input type=\"color\" value={settings.surfaceAccentA} onChange={(e) => setSetting(\"surfaceAccentA\", e.target.value)} className=\"w-12 h-12 -translate-x-2 -translate-y-2 cursor-pointer\" />
                      </div>
                    </div>
                  }
                />
                <ListItem 
                  title=\"Surface B\" 
                  action={
                    <div className=\"flex items-center gap-3\">
                      <span className=\"text-[13px] text-muted-foreground font-mono uppercase\">{settings.surfaceAccentB}</span>
                      <div className=\"w-8 h-8 rounded-full overflow-hidden border border-border shrink-0\">
                        <input type=\"color\" value={settings.surfaceAccentB} onChange={(e) => setSetting(\"surfaceAccentB\", e.target.value)} className=\"w-12 h-12 -translate-x-2 -translate-y-2 cursor-pointer\" />
                      </div>
                    </div>
                  }
                  isLast
                />
              </div>
            ) : (
              <div className=\"p-8 text-sm text-muted-foreground text-center\">
                Theme Studio module is disabled. Application uses standard default styling.
              </div>
            )}
          </SectionCard>
        </TabsContent>

        {moduleState.enabled.merge_assistant && (
          <TabsContent value=\"modules\" className=\"animate-in fade-in-50\">
            <SectionCard title=\"Import & Alias Rules\" description=\"Configure thresholds for automated conflict resolution.\">
              <div className=\"flex flex-col\">
                <ListItem 
                  title=\"Auto-merge Threshold\" 
                  description=\"Minimum similarity to auto-merge incoming books.\"
                  action={
                    <input
                      type=\"number\" min={0.5} max={0.99} step={0.01}
                      value={settings.mergeSimilarityThreshold}
                      onChange={(e) => setSetting(\"mergeSimilarityThreshold\", Number(e.target.value))}
                      className=\"h-9 w-24 rounded-lg border border-input bg-background px-3 py-1 text-sm text-right focus:ring-2 focus:ring-primary focus:outline-none\"
                    />
                  }
                />
                <ListItem 
                  title=\"Review Threshold\" 
                  description=\"Minimum similarity to queue items for manual merge review.\"
                  action={
                    <input
                      type=\"number\" min={0.4} max={0.95} step={0.01}
                      value={settings.mergeReviewThreshold}
                      onChange={(e) => setSetting(\"mergeReviewThreshold\", Number(e.target.value))}
                      className=\"h-9 w-24 rounded-lg border border-input bg-background px-3 py-1 text-sm text-right focus:ring-2 focus:ring-primary focus:outline-none\"
                    />
                  }
                />
                <ListItem 
                  title=\"Alias Quorum\" 
                  description=\"Votes needed to auto-approve community aliases.\"
                  action={
                    <input
                      type=\"number\" min={2} max={10} step={1}
                      value={settings.aliasVoteQuorum}
                      onChange={(e) => setSetting(\"aliasVoteQuorum\", Number(e.target.value))}
                      className=\"h-9 w-24 rounded-lg border border-input bg-background px-3 py-1 text-sm text-right focus:ring-2 focus:ring-primary focus:outline-none\"
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
"""

with open('app/settings/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
