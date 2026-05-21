
import fs from 'fs';

const content = fs.readFileSync('frontend/src/app/pendaftaran/page.tsx', 'utf8');
const lines = content.split('\n');

let stack = [];
lines.forEach((line, i) => {
    if (i + 1 < 1375 || i + 1 > 1980) return;
    
    const openRegex = /<div(?!.*?\/>)|<>/g;
    const closeRegex = /<\/div>|<\/>/g;
    let tags = [];
    let match;
    while ((match = openRegex.exec(line)) !== null) {
        tags.push({ type: 'open', index: match.index, tag: match[0] });
    }
    while ((match = closeRegex.exec(line)) !== null) {
        tags.push({ type: 'close', index: match.index, tag: match[0] });
    }
    tags.sort((a, b) => a.index - b.index);

    tags.forEach(tag => {
        if (tag.type === 'open') {
            stack.push({ line: i + 1, tag: tag.tag });
            console.log(`[OPEN]  Line ${i+1}: ${tag.tag} (Stack: ${stack.length})`);
        } else {
            if (stack.length > 0) {
                const last = stack.pop();
                console.log(`[CLOSE] Line ${i+1}: ${tag.tag} (Closed ${last.tag} from Line ${last.line}) (Stack: ${stack.length})`);
            } else {
                console.log(`[EXTRA] Line ${i+1}: ${tag.tag}`);
            }
        }
    });
});
