
import fs from 'fs';

const content = fs.readFileSync('frontend/src/app/pendaftaran/page.tsx', 'utf8');
const lines = content.split('\n');

let stack = [];
lines.forEach((line, i) => {
    for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '(' || char === '{' || char === '[') {
            stack.push({ char, line: i + 1, col: j + 1 });
        } else if (char === ')' || char === '}' || char === ']') {
            if (stack.length === 0) {
                console.log(`Extra closing ${char} at line ${i + 1}, col ${j + 1}`);
            } else {
                const last = stack.pop();
                const expected = { ')': '(', '}': '{', ']': '[' }[char];
                if (last.char !== expected) {
                    console.log(`Mismatched closing ${char} at line ${i + 1}, col ${j + 1}. Expected match for ${last.char} from line ${last.line}`);
                }
            }
        }
    }
});

console.log('Unclosed brackets:');
stack.forEach(s => console.log(`${s.char} from line ${s.line}, col ${s.col}`));
