const fs = require('fs');
const content = fs.readFileSync('d:/!DISCO LOCAL D - AREA DE PASTAS/PROJETOS DE APLICATIVOS/AevumPro/AevumPro/src/components/projects/INSSRegularizationTab.tsx', 'utf-8');
const lines = content.split('\n');

let clean = content
  .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
  .replace(/'[^']*'|"[^"]*"|`[^`]*`/g, '');

let divCount = 0;
let regex = /<(\/?[a-zA-Z0-9]+)(?:\s+[^>]*?)?(\/?)>/g;
let match;

while ((match = regex.exec(clean)) !== null) {
  let tagName = match[1];
  let isClosing = tagName.startsWith('/');
  let isSelfClosing = match[2] === '/';
  
  if (isSelfClosing) continue;

  if (tagName === 'div') {
    divCount++;
  } else if (tagName === '/div') {
    divCount--;
  }
}

console.log('Total div balance in file: ' + divCount);
if (divCount !== 0) {
    console.log('Unclosed divs detected!');
}
