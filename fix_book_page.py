import os
import re

def main():
    fpath = r'app/book/[id]/page.tsx'
    if not os.path.exists(fpath):
        return
    
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Convert to client component
    if "'use client'" not in content and '"use client"' not in content:
        content = "'use client';\n" + content
    
    # Remove async/await for client component
    content = content.replace("export default async function", "export default function")
    content = content.replace("await createClient();", "null; // createClient removed")
    content = content.replace("await cookies();", "null; // cookies removed")
    content = content.replace("await params", "params")
    content = content.replace("await searchParams", "searchParams")
    
    # Replace supabase with mock store usage
    content = content.replace("import { notFound } from \"next/navigation\";", "import { notFound } from \"next/navigation\";\nimport { useAppStore } from \"@/lib/store\";\nimport { useEffect, useState } from \"react\";")
    
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    main()
