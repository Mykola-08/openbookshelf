import sys
import re

with open('app/settings/page.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace TabsList, remove all those manual classes, let shadcn's layout handle it
text = re.sub(r'<TabsList className="mb-6 w-full flex overflow-x-auto justify-start bg-muted p-1 border-none rounded-full">', '<TabsList className="mb-6 w-full flex overflow-x-auto justify-start">', text)
text = re.sub(r' className="rounded-full px-4"', '', text)

# Remove other pills / roundeds
text = text.replace('rounded-full', 'rounded-md')
text = text.replace('rounded-xl', 'rounded-lg')
text = text.replace('focus:ring-2 focus:ring-primary focus:outline-none', 'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring')

with open('app/settings/page.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
