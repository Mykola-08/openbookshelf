import sys
import re

with open('app/settings/page.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Add Card imports
if 'from "@/components/ui/card"' not in text:
    text = text.replace('import { Button } from "@/components/ui/button";', 'import { Button } from "@/components/ui/button";\nimport { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";')

# Replace SectionCard definition
# Actually, since SectionCard is defined inside SettingsPage, we can just replace its implementation 
# or change references. Changing implementation is easier.

new_section_card = '''const SectionCard = ({ children, title, description, badge }: any) => (
    <Card className="mb-8">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {badge && <div className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-md font-medium">{badge}</div>}
      </CardHeader>
      <CardContent className="p-0">
        {children}
      </CardContent>
    </Card>
  );'''

text = re.sub(r'// Apple-like sections:.*?(?=const ListItem =)', new_section_card + '\n\n  ', text, flags=re.DOTALL)

with open('app/settings/page.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
