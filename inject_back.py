import sys

with open('components/ModulesMarketplace.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'import { Button } from "@/components/ui/button";',
    'import { Button } from "@/components/ui/button";\nimport Link from "next/link";\nimport { ArrowLeft } from "lucide-react";'
)

content = content.replace(
    '<h1 className="text-3xl font-bold tracking-tight text-foreground">Modules Marketplace</h1>',
    '<Link href="/settings" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"><ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Settings</Link>\n        <h1 className="text-3xl font-bold tracking-tight text-foreground">Modules Marketplace</h1>'
)

with open('components/ModulesMarketplace.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
