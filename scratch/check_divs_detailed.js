
import fs from 'fs';

const content = fs.readFileSync('frontend/src/app/pendaftaran/page.tsx', 'utf8');
const lines = content.split('\n');

let balance = 0;
lines.forEach((line, i) => {
    const opens = (line.match(/<div/g) || []).length;
    const closes = (line.match(/<\/div/g) || []).length;
    balance += opens;
    balance -= closes;
    if (i + 1 >= 1375 && i + 1 <= 1450) {
        console.log(`Line ${i + 1}: balance ${balance} | ${line.trim()}`);
    }
    if (i + 1 >= 1740 && i + 1 <= 1765) {
        console.log(`Line ${i + 1}: balance ${balance} | ${line.trim()}`);
    }
    if (i + 1 >= 1870 && i + 1 <= 1890) {
        console.log(`Line ${i + 1}: balance ${balance} | ${line.trim()}`);
    }
});
