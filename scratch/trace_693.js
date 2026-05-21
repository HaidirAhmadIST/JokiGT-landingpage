
import fs from 'fs';

const content = fs.readFileSync('frontend/src/app/pendaftaran/page.tsx', 'utf8');
const lines = content.split('\n');

let stack = [];
lines.forEach((line, i) => {
    const openRegex = /<div(?!.*?\/>)/g;
    const closeRegex = /<\/div/g;
    let tags = [];
    let match;
    while ((match = openRegex.exec(line)) !== null) {
        tags.push({ type: 'open', index: match.index });
    }
    while ((match = closeRegex.exec(line)) !== null) {
        tags.push({ type: 'close', index: match.index });
    }
    tags.sort((a, b) => a.index - b.index);

    tags.forEach(tag => {
        if (tag.type === 'open') {
            stack.push({ line: i + 1, content: line.trim() });
        } else {
            if (stack.length > 0) {
                const last = stack.pop();
                if (last.line === 693) {
                    console.log(`Line ${i + 1} closed 693!`);
                }
            } else {
                console.log(`Extra closing div at line ${i + 1}`);
            }
        }
    });
});
