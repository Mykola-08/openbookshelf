import sys
import re

with open('components/ModulesMarketplace.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Add Card imports
if 'from "@/components/ui/card"' not in text:
    text = text.replace('import { Button } from "@/components/ui/button";', 'import { Button } from "@/components/ui/button";\nimport { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";')
    # Use standard shadcn input instead of random ones
    text = text.replace('import { Switch } from "@/components/ui/switch";', 'import { Switch } from "@/components/ui/switch";\nimport { Input } from "@/components/ui/input";')

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

text = re.sub(r'// Apple-like sections:.*?(?=const ListItem =)', new_section_card + '\n\n', text, flags=re.DOTALL)

# Replace inputs with Shadcn Input component
text = re.sub(r'<input\s+value=\{name\}.*?className=".*?".*?/>', '<Input\n            value={name}\n            onChange={(event) => setName(event.target.value)}\n            placeholder="Module name"\n            className="flex-1"\n          />', text, flags=re.DOTALL)

text = re.sub(r'<input\s+value=\{description\}.*?className=".*?".*?/>', '<Input\n            value={description}\n            onChange={(event) => setDescription(event.target.value)}\n            placeholder="Module description"\n            className="flex-1"\n          />', text, flags=re.DOTALL)

# Remove other roundeds
text = text.replace('rounded-xl', '')
text = text.replace('rounded-full', 'rounded-md')

with open('components/ModulesMarketplace.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
