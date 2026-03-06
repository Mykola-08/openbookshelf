const fs = require('fs');
let text = fs.readFileSync('app/settings/page.tsx', 'utf8');

let parts = text.split('<TabsContent value="philosophy"');
text = parts[0];

let newContent = '        <TabsContent value="philosophy" className="animate-in fade-in-50">\n          <SectionCard title="The OpenBookshelf Way" description="We believe reading software should be as focus-oriented as the books themselves.">\n            <div className="flex flex-col gap-2 mt-4">\n              {PRINCIPLES.map((p, i) => (\n                <div key={i} className="flex gap-4 p-4 rounded-xl bg-card border border-border/40">\n                  <div className="shrink-0 mt-0.5"><p.icon className="w-5 h-5 text-muted-foreground" /></div>\n                  <div className="space-y-1">\n                    <h3 className="font-semibold text-[15px]">{p.title}</h3>\n                    <p className="text-[13px] text-muted-foreground">{p.description}</p>\n                  </div>\n                </div>\n              ))}\n            </div>\n            \n            <div className="mt-6 flex gap-4 p-5 rounded-xl bg-accent/30 border border-accent">\n              <Compass className="w-5 h-5 text-foreground shrink-0 mt-0.5" />\n              <div className="space-y-1">\n                <div className="font-semibold text-[14px]">Guiding Star</div>\n                <p className="text-[13px] text-muted-foreground leading-relaxed">\n                  "A library is not a collection of books, but a collection of thoughts. \n                  The software should never stand between a reader and those thoughts."\n                </p>\n              </div>\n            </div>\n          </SectionCard>\n        </TabsContent>\n      </div>\n      </Tabs>\n    </main>\n  );\n}';

// Since the 	ext string ends with </div> (hopefully) or we replaced things weirdly.
// Let's ensure the end is completely trimmed up to the last </TabsContent>
let lastTabsContent = text.lastIndexOf('</TabsContent>');
text = text.substring(0, lastTabsContent + '</TabsContent>'.length) + '\n';

text += newContent;

fs.writeFileSync('app/settings/page.tsx', text);

