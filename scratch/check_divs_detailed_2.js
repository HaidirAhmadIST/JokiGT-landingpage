
import fs from 'fs';

const content = fs.readFileSync('frontend/src/app/pendaftaran/page.tsx', 'utf8');
const lines = content.split('\n');

let balance = 0;
lines.forEach((line, i) => {
    const opens = (line.match(/<div/g) || []).length;
    const closes = (line.match(/<\/div/g) || []).length;
    balance += opens;
    balance -= closes;
    if (i + 1 >= 1950 && i + 1 <= 1980) {
        console.log(`Line ${i + 1}: balance ${balance} | ${line.trim()}`);
    }
});
