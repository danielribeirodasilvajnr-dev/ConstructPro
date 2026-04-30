const fs = require('fs');
const content = fs.readFileSync('d:/!DISCO LOCAL D - AREA DE PASTAS/PROJETOS DE APLICATIVOS/AevumPro/AevumPro/src/components/projects/INSSRegularizationTab.tsx', 'utf-8');
const lines = content.split('\n');

let balance = 0;
let regex = /<(\/?[a-zA-Z0-9]+)(?:\s+[^>]*?)?(\/?)>/g;

for (let i = 1627; i < 2145; i++) { // Line 1628 to 2145
  let clean = lines[i]
    .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
    .replace(/'[^']*'|"[^"]*"|`[^`]*`/g, '');
    
  let match;
  while ((match = regex.exec(clean)) !== null) {
    let tagName = match[1];
    let isSelfClosing = match[2] === '/';
    if (isSelfClosing) continue;
    
    if (tagName === 'div') balance++;
    else if (tagName === '/div') balance--;
  }
  if (balance < 0) {
      console.log('Negative balance at line ' + (i+1));
  }
}
console.log('Final balance: ' + balance);
