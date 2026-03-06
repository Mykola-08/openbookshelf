import sys
import re

with open('app/settings/page.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update TabsTrigger for philosophy
old_trigger = '''<TabsTrigger value="philosophy" className="rounded-lg px-4 py-2 text-[14px] justify-start data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none hover:bg-muted/50 transition-colors" asChild>
            <Link href="/settings/philosophy">
              <Compass className="w-4 h-4 mr-2" />
              <span>Philosophy</span>
            </Link>
          </TabsTrigger>'''
          
new_trigger = '''<TabsTrigger value="philosophy" className="rounded-lg px-4 py-2 text-[14px] justify-start data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none hover:bg-muted/50 transition-colors">
            <Compass className="w-4 h-4 mr-2" />
            <span>Philosophy</span>
          </TabsTrigger>'''

if old_trigger in text:
    text = text.replace(old_trigger, new_trigger)
else:
    # try regex
    text = re.sub(r'<TabsTrigger value="philosophy"[^>]*>\\s*<Link href="/settings/philosophy">\\s*<Compass[^>]*>\\s*<span>Philosophy</span>\\s*</Link>\\s*</TabsTrigger>', new_trigger, text, flags=re.MULTILINE)

# 2. Add Principles Array at top
principles_code = '''
import { Layout, Zap, Heart, ShieldCheck, Microscope, Layers } from "lucide-react";

const PRINCIPLES = [
  { icon: Layout, title: "Minimalism by Default", description: "Interfaces should start small. Use only what you need." },
  { icon: Sparkles, title: "Hyper-Personalization", description: "From font pairings to database schema, the system adapts to your workflow." },
  { icon: ShieldCheck, title: "Privacy and Ownership", description: "Your data belongs to you. Full offline capability." },
  { icon: Zap, title: "Performance over Polish", description: "A fast interface matters more than a flashy one." },
  { icon: Layers, title: "Modular Complexity", description: "Advanced features are optional modules." },
  { icon: Heart, title: "Digital Garden", description: "Your library should feel alive—cultivated over time." }
];
'''
text = text.replace('import { createClient } from "@/utils/supabase/client";', 'import { createClient } from "@/utils/supabase/client";' + principles_code)
text = text.replace('Compass, Eye } from "lucide-react";', 'Compass, Eye, Sparkles } from "lucide-react";')

# 3. Add TabsContent for philosophy at the end
philosophy_content = '''
        <TabsContent value="philosophy" className="animate-in fade-in-50">
          <SectionCard title="The OpenBookshelf Way" description="We believe reading software should be as focus-oriented as the books themselves.">
            <div className="flex flex-col gap-2 mt-4">
              {PRINCIPLES.map((p, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-xl bg-card border border-border/40">
                  <div className="shrink-0 mt-0.5"><p.icon className="w-5 h-5 text-muted-foreground" /></div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-[15px]">{p.title}</h3>
                    <p className="text-[13px] text-muted-foreground">{p.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex gap-4 p-5 rounded-xl bg-accent/30 border border-accent">
              <Compass className="w-5 h-5 text-foreground shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold text-[14px]">Guiding Star</div>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  "A library is not a collection of books, but a collection of thoughts. 
                  The software should never stand between a reader and those thoughts."
                </p>
              </div>
            </div>
          </SectionCard>
        </TabsContent>
'''

text = text.replace('</Tabs>', philosophy_content + '\\n      </Tabs>')

with open('app/settings/page.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
