
import fs from 'fs';

const content = fs.readFileSync('frontend/src/app/pendaftaran/page.tsx', 'utf8');
let balP = 0;
let balB = 0;
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
    } else if (char === '(') {
        balP++;
    } else if (char === ')') {
        balP--;
    } else if (char === '{') {
        balB++;
    } else if (char === '}') {
        balB--;
    }
}

console.log('Balanced Parens:', balP);
console.log('Balanced Braces:', balB);
