
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
                stack.pop();
            } else {
                console.log(`Extra closing div at line ${i + 1}`);
            }
        }
    });
    if (i + 1 === 2100) {
        console.log('Stack at 2100:', stack.map(s => s.line));
    }
});

console.log('Final stack:', stack.map(s => s.line));
