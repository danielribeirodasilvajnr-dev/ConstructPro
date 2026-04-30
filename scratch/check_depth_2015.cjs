const fs = require('fs');
const content = fs.readFileSync('d:/!DISCO LOCAL D - AREA DE PASTAS/PROJETOS DE APLICATIVOS/AevumPro/AevumPro/src/components/projects/INSSRegularizationTab.tsx', 'utf-8');
const lines = content.split('\n');

let stack = [];
let regex = /<(\/?[a-zA-Z0-9]+)(?:\s+[^>]*?)?(\/?)>/g;

for (let i = 0; i < lines.length; i++) {
  let clean = lines[i]
    .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
    .replace(/'[^']*'|"[^"]*"|`[^`]*`/g, '');
    
  let match;
  while ((match = regex.exec(clean)) !== null) {
    let tagName = match[1];
    let isSelfClosing = match[2] === '/';
    if (isSelfClosing) continue;
    
    if (tagName === 'div') {
        stack.push(i + 1);
    } else if (tagName === '/div') {
        if (stack.length === 0) {
            console.log('Extra closing div at line ' + (i+1));
        } else {
            stack.pop();
        }
    }
  }
  if (i + 1 >= 1876 && i + 1 <= 2015) {
      console.log('Line ' + (i+1) + ' Stack Depth: ' + stack.length);
  }
}
