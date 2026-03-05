const fs = require('fs');
let content = fs.readFileSync('app/book/[id]/page.tsx', 'utf8');

if (!content.includes('QuickActionsBar')) {
    content = content.replace('import { CommunityBookSection } from "@/components/CommunityBookSection";', 'import { CommunityBookSection } from "@/components/CommunityBookSection";\nimport { QuickActionsBar } from "@/components/QuickActionsBar";');

    const componentInsertion = `
      <QuickActionsBar 
        bookId={book.id} 
        hasFile={!!file} 
        status={userBook?.status || "toread"} 
        progress={userBook?.progress || 0} 
        readingLocation={userBook?.reading_location || null} 
      />
    </main>`;

    content = content.replace('</main>', componentInsertion);
    fs.writeFileSync('app/book/[id]/page.tsx', content);
    console.log('Added QuickActionsBar');
}
