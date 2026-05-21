
import fs from 'fs';

const content = fs.readFileSync('frontend/src/app/pendaftaran/page.tsx', 'utf8');
let stack = [];
for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '(' || char === '{') {
        stack.push({ char, line: content.substring(0, i).split('\n').length });
    } else if (char === ')' || char === '}') {
        if (stack.length === 0) {
            console.log(`Extra ${char} at line ${content.substring(0, i).split('\n').length}`);
        } else {
            const last = stack.pop();
            const expected = char === ')' ? '(' : '{';
            if (last.char !== expected) {
                console.log(`Mismatch at line ${content.substring(0, i).split('\n').length}: ${char} doesn't match ${last.char} from line ${last.line}`);
            }
        }
    }
}
console.log('Final stack:', stack.map(s => `${s.char}@${s.line}`));
