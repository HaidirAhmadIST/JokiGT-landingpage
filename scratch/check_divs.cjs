const fs = require('fs');
const content = fs.readFileSync('c:\\data_pak-main\\frontend\\src\\app\\pendaftaran\\page.tsx', 'utf8');
const lines = content.split('\n');

let openDivs = 0;
let openBraces = 0;
let openParens = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const divOpens = (line.match(/<div/g) || []).length;
  const divCloses = (line.match(/<\/div>/g) || []).length;
  const braceOpens = (line.match(/\{/g) || []).length;
  const braceCloses = (line.match(/\}/g) || []).length;
  const parenOpens = (line.match(/\(/g) || []).length;
  const parenCloses = (line.match(/\)/g) || []).length;

  openDivs += divOpens - divCloses;
  openBraces += braceOpens - braceCloses;
  openParens += parenOpens - parenCloses;

  if (i >= 1340 && i <= 1350) {
    console.log(`${i + 1}: D:${openDivs} B:${openBraces} P:${openParens} | ${line.trim()}`);
  }
}
