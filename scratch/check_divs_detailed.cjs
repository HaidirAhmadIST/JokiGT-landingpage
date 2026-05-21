const fs = require('fs');
const content = fs.readFileSync('c:\\data_pak-main\\frontend\\src\\app\\pendaftaran\\page.tsx', 'utf8');
const lines = content.split('\n');

let stack = [];
let lineNum = 0;

for (let line of lines) {
  lineNum++;
  
  // Very crude tag matching
  const tags = line.match(/<[a-zA-Z0-9]+|<\/[a-zA-Z0-9]+>/g) || [];
  for (let tag of tags) {
    if (tag.startsWith('</')) {
      const type = tag.substring(2, tag.length - 1);
      if (stack.length > 0 && stack[stack.length - 1].type === type) {
        stack.pop();
      } else {
        // console.log(`Extra closing tag at ${lineNum}: ${tag}`);
      }
    } else if (!tag.endsWith('/>')) {
      // Check if self-closing in next chars? No, assume not for now unless it's a known one or has />
      // This is too crude.
    }
  }
}
