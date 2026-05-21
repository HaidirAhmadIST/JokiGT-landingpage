
import fs from 'fs';

const content = fs.readFileSync('frontend/src/app/pendaftaran/page.tsx', 'utf8');
const lines = content.split('\n');

let stack = [];
lines.forEach((line, i) => {
    // This is naive but works for standard divs
    const tags = line.match(/<div|<\/div/g) || [];
    tags.forEach(tag => {
        if (tag === '<div') {
            stack.push(i + 1);
        } else {
            if (stack.length > 0) {
                stack.pop();
            } else {
                console.log(`Extra closing div at line ${i + 1}`);
            }
        }
    });
});

console.log('Unclosed divs started at lines:', stack);
