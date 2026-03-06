import re

with open('app/settings/page.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Make the wrapper for the overall layout wider
text = text.replace('max-w-3xl mx-auto space-y-6', 'max-w-5xl mx-auto space-y-8')

# Change Tabs component structure
tabs_start = '<Tabs defaultValue="profile" className="w-full">'
tabs_replacement = '<Tabs defaultValue="profile" orientation="vertical" className="flex flex-col md:flex-row gap-8 md:gap-12 w-full">'

text = text.replace(tabs_start, tabs_replacement)

# Change TabsList
list_start = '<TabsList className="mb-6 w-full flex overflow-x-auto justify-start bg-muted/50 p-1 border border-border/30 rounded-xl">'
list_replacement = '<TabsList className="w-full md:w-56 shrink-0 flex flex-row md:flex-col justify-start h-auto bg-transparent p-0 border-none overflow-x-auto md:overflow-visible gap-1.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">'

text = text.replace(list_start, list_replacement)

# Update all TabsTrigger to be styled for vertical / unified
text = re.sub(
    r'<TabsTrigger value="(.*?)" className="rounded-lg px-3.5 text-\[13px\] data-\[state=active\]:shadow-sm"(.*?)>',
    r'<TabsTrigger value="\g<1>" className="rounded-lg px-4 py-2 text-[14px] justify-start data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none hover:bg-muted/50 transition-colors"\g<2>>',
    text
)

# Replace 'hidden md:inline' with just nothing, we want text always visible
text = text.replace('<span className="hidden md:inline">', '<span>')
text = text.replace('className="w-3.5 h-3.5 md:mr-1.5"', 'className="w-4 h-4 mr-2"')

text = text.replace('</TabsList>', '</TabsList>\\n        <div className="flex-1 min-w-0 w-full space-y-6">')
text = text.replace('</Tabs>', '</div>\\n      </Tabs>')

with open('app/settings/page.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

