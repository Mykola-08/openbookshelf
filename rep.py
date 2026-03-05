import sys

def main():
    path = 'app/book/[id]/page.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = content.replace(
        'import { MODULE_COOKIE_NAME, parseModuleState } from "@/lib/config/modules";',
        'import { MODULE_COOKIE_NAME, parseModuleState } from "@/lib/config/modules";\nimport { GenerateDescriptionButton, GenerateChapterSummaryButton } from "@/components/AIGenerateButtons";'
    )
    
    content = content.replace(
        '  chapter_url?: string | null;\n}',
        '  chapter_url?: string | null;\n  summary?: string | null;\n}'
    )
    
    content = content.replace(
        '.select("id, title, chapter_number, word_count, published_at, chapter_url")',
        '.select("id, title, chapter_number, word_count, published_at, chapter_url, summary")'
    )
    
    content = content.replace(
        '''                   <h3 className="font-semibold text-strong-ui mb-2 text-lg">Description</h3>\n                   <div \n                     className="text-muted-ui leading-relaxed max-w-none prose prose-sm"\n                     dangerouslySetInnerHTML={{ __html: book.description || \'<p className="text-muted-ui italic">No description available.</p>\' }}\n                   />''',
        '''                   <div className="flex items-center justify-between mb-2">\n                     <h3 className="font-semibold text-strong-ui text-lg">Description</h3>\n                     {!book.description && <GenerateDescriptionButton bookId={book.id} />}\n                   </div>\n                   <div \n                     className="text-muted-ui leading-relaxed max-w-none prose prose-sm"\n                     dangerouslySetInnerHTML={{ __html: book.description || \'<p className="text-muted-ui italic">No description available.</p>\' }}\n                   />'''
    )
    
    content = content.replace(
        '''                               {chapterSummaryEnabled && (
                                 <p className="text-xs text-muted-ui mt-1 line-clamp-2">
                                   {chapter.title
                                     ? ${chapter.title} focuses on the next progression point in the story.
                                     : "Summary will be available after chapter metadata is enriched."}
                                 </p>
                               )}''',
        '''                               {chapterSummaryEnabled && (
                                 <div className="mt-2 mb-1">
                                   <p className="text-sm text-muted-foreground">
                                     {chapter.summary || "No summary available for this chapter."}
                                   </p>
                                   {!chapter.summary && (
                                     <GenerateChapterSummaryButton 
                                       bookId={book.id} 
                                       chapterId={chapter.id} 
                                       chapterTitle={chapter.title || "Chapter " + (chapter.chapter_number || "")} 
                                     />
                                   )}
                                 </div>
                               )}'''
    )

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

main()
