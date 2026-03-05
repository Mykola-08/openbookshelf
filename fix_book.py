import os
path = 'app/book/[id]/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('import { Book, Edit, Upload, Image as ImageIcon, Sparkles, BookOpen, Clock, Tag }', 'import { Book, Edit, Upload, Image as ImageIcon, Sparkles, BookOpen, Clock, Tag, Share2, MessageSquare, Plus, Edit3, Users }')
content = content.replace('import { Book, Check, Download, AlertCircle', 'import { Book, Check, Download, AlertCircle, Share2, MessageSquare, Plus, Edit3, Users')

content = content.replace('text-strong-ui', 'text-foreground')
content = content.replace('text-muted-ui', 'text-muted-foreground')
content = content.replace('panel-surface', 'bg-card border border-border/50 text-card-foreground shadow-sm')

social_block = '''                 {/* Social / Community Block */}
                 <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <h3 className="font-semibold text-foreground text-lg flex items-center gap-2 border-b border-border/50 pb-2">
                       <Users className="w-5 h-5 text-primary" />
                       Community & Social
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <Card className="bg-card shadow-sm border-border/50 hover:shadow-md transition-all">
                          <CardContent className="p-4 space-y-3">
                             <div className="flex justify-between items-center">
                                <h4 className="font-semibold text-sm">Public Notes & Quotes</h4>
                                <Button variant="ghost" size="sm" className="h-7 text-xs"><Share2 className="w-3 h-3 mr-1" /> Share Part</Button>
                             </div>
                             <div className="bg-muted p-3 flex flex-col text-sm rounded-lg border-l-2 border-l-primary/50 relative group">
                                "This passage completely changed how I view modern engineering. Incredible structure."
                                <span className="text-xs text-muted-foreground mt-2">— User @alice, Page 42</span>
                             </div>
                          </CardContent>
                       </Card>
                       <Card className="bg-card shadow-sm border-border/50 hover:shadow-md transition-all">
                          <CardContent className="p-4 space-y-3">
                             <div className="flex justify-between items-center">
                                <h4 className="font-semibold text-sm">Live Readers</h4>
                             </div>
                             <div className="flex -space-x-3 mt-2">
                                <div className="w-9 h-9 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-xs font-bold ring-0 z-30 text-primary" title="Charlie (Page 15)">C</div>
                                <div className="w-9 h-9 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-xs font-bold ring-0 z-20 text-foreground" title="Bob (Page 89)">B</div>
                                <div className="w-9 h-9 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-bold ring-0 z-10 text-muted-foreground">+3</div>
                             </div>
                             <p className="text-xs text-muted-foreground mt-2 flex items-center justify-between">
                                 <span>5 people reading right now.</span>
                                 <a href="#" className="text-primary hover:underline font-medium">Manage visibility</a>
                             </p>
                          </CardContent>
                       </Card>
                    </div>
                    
                    <Card className="bg-card shadow-sm border-border/50">
                        <CardContent className="p-4 space-y-5">
                             <div className="flex justify-between items-center border-b border-border/50 pb-2">
                                <h4 className="font-semibold text-sm flex items-center gap-2">Community Reviews</h4>
                                <Button variant="outline" size="sm" className="h-8"><Edit3 className="w-3 h-3 mr-2" /> Write Review</Button>
                             </div>
                             <div className="space-y-4">
                                <div className="pb-2">
                                   <div className="flex items-center gap-2 mb-1">
                                      <div className="w-6 h-6 rounded bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">AT</div>
                                      <span className="font-semibold text-sm">Alex_T</span>
                                      <span className="text-amber-500 text-xs flex">
                                         ★★★★☆
                                      </span>
                                   </div>
                                   <p className="text-sm text-muted-foreground pl-8">Fantastic pacing. Imported this via the Flibusta OPDS preset and the streaming feature worked flawlessly without filling up my local DB!</p>
                                </div>
                             </div>
                        </CardContent>
                    </Card>
                 </div>

                 {aliasResolutionEnabled && ('''

content = content.replace('{aliasResolutionEnabled && (', social_block)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
