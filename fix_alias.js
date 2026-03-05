const fs = require('fs');
let code = fs.readFileSync('components/AliasReviewBoard.tsx', 'utf8');

if (!code.includes('sonner')) {
    code = `import { toast } from 'sonner';\n` + code;
    
    code = code.replace(/await voteAliasAction\(([^,]+),([^)]+)\);/g, `const result = await voteAliasAction($1, $2);
      if (result.success) {
        toast.success(isSame ? "Approved alias mapping" : "Rejected alias mapping");
      } else {
        toast.error("Failed to vote: " + result.error);
      }`);
      
    fs.writeFileSync('components/AliasReviewBoard.tsx', code);
    console.log('Added toast to AliasReviewBoard.tsx');
}
