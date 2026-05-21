
import fs from 'fs';

const content = fs.readFileSync('frontend/src/app/pendaftaran/page.tsx', 'utf8');
let stack = [];
let inString = false;
let stringChar = '';
let inComment = false;
let inMultilineComment = false;

for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const next = content[i+1];
    
    if (inComment) {
        if (char === '\n') inComment = false;
        continue;
    }
    if (inMultilineComment) {
        if (char === '*' && next === '/') {
            inMultilineComment = false;
            i++;
        }
        continue;
    }
    if (inString) {
        if (char === stringChar && content[i-1] !== '\\') {
            inString = false;
        }
        continue;
    }
    
    if (char === '/' && next === '/') {
        inComment = true;
        i++;
    } else if (char === '/' && next === '*') {
        inMultilineComment = true;
        i++;
    } else if (char === '"' || char === "'" || char === '`') {
        inString = true;
        stringChar = char;
    } else if (char === '(' || char === '{') {
        stack.push({ char, line: i + 1, col: i - content.lastIndexOf('\n', i) });
    } else if (char === ')' || char === '}') {
        if (stack.length === 0) {
            console.log(`Extra ${char} at line ${i + 1}`);
        } else {
            const last = stack.pop();
            const expected = char === ')' ? '(' : '{';
            if (last.char !== expected) {
                console.log(`Mismatch: ${char} at line ${i+1} doesn't match ${last.char} from line ${last.line}`);
            }
        }
    }
}

console.log('Unclosed:');
stack.forEach(s => console.log(`${s.char} from line ${s.line}`));
