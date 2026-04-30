const fs = require('fs');
const content = fs.readFileSync('d:/!DISCO LOCAL D - AREA DE PASTAS/PROJETOS DE APLICATIVOS/AevumPro/AevumPro/src/components/projects/INSSRegularizationTab.tsx', 'utf-8');
const lines = content.split('\n');
const range = lines.slice(1627, 2145).join('\n'); // Line 1628 to 2145 (0-indexed)

let clean = range
  .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
  .replace(/'[^']*'|"[^"]*"|`[^`]*`/g, '');

let divCount = 0;
let stack = [];
let regex = /<(\/?[a-zA-Z0-9]+)(?:\s+[^>]*?)?(\/?)>/g;
let match;

while ((match = regex.exec(clean)) !== null) {
  let tagName = match[1];
  let isClosing = tagName.startsWith('/');
  let isSelfClosing = match[2] === '/';
  
  if (tagName === 'div') {
    divCount++;
    stack.push({ type: 'open', line: 1628 });
  } else if (tagName === '/div') {
    divCount--;
    stack.pop();
  }
}

console.log('Balance for range 1628-2145: ' + divCount);
if (divCount !== 0) {
    console.log('Unclosed divs detected!');
}
