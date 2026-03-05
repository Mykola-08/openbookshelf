import sys

with open('app/book/[id]/page.tsx', 'r', encoding='utf-8') as f:
    orig = f.read()

# Add import
if 'CommunityBookSection' not in orig:
    orig = orig.replace('import { GenerateDescriptionButton, GenerateChapterSummaryButton } from "@/components/AIGenerateButtons";',
                        'import { GenerateDescriptionButton, GenerateChapterSummaryButton } from "@/components/AIGenerateButtons";\nimport { CommunityBookSection } from "@/components/CommunityBookSection";')

if '<CommunityBookSection' not in orig:
    # Just append before the last closing tags. 
    # Usually it's </main> or similar.
    # Let's locate the last </main>
    if '</main>' in orig:
        orig = orig.replace('</main>', '\n        <CommunityBookSection bookId={book.id} title={book.title} />\n      </main>')
    else:
        orig = orig.replace('        </div>\n      </div>\n    </div>\n  );\n}', '        </div>\n      </div>\n\n      <CommunityBookSection bookId={book.id} title={book.title} />\n    </div>\n  );\n}')

with open('app/book/[id]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(orig)

print("Injected CommunityBookSection!")
