import sys
import re

with open('app/settings/page.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Make SectionCard generic Card without forcing weird paddings
section_card_replacement = '''const SectionCard = ({ children, title, description, badge }: any) => (
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
  );'''

text = re.sub(r'const SectionCard = \(\{ children, title, description, badge \}: any\) => \(.*?</Card>\n  \);', section_card_replacement, text, flags=re.DOTALL)

# Update ListItem to not use prominent borders
list_item_replacement = '''const ListItem = ({ children, isLast, title, description, action }: any) => (
    <div className={cn("flex items-center justify-between gap-4")}>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none">{title}</p>
        {description && <p className="text-[13px] text-muted-foreground">{description}</p>}
        {children && <div className="mt-3">{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );'''

text = re.sub(r'const ListItem = \(\{ children, isLast, title, description, action \}: any\) => \(.*?</Card>\n  \);|const ListItem = \(\{ children, isLast, title, description, action \}: any\) => \(.*?</div>\n  \);', list_item_replacement, text, flags=re.DOTALL)

with open('app/settings/page.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
