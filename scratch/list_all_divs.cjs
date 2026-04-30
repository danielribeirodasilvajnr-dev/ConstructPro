const fs = require('fs');
const content = fs.readFileSync('d:/!DISCO LOCAL D - AREA DE PASTAS/PROJETOS DE APLICATIVOS/AevumPro/AevumPro/src/components/projects/INSSRegularizationTab.tsx', 'utf-8');
const lines = content.split('\n');

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
    
    if (tagName === 'div' || tagName === '/div') {
        console.log((i+1) + ': ' + match[0]);
    }
  }
}
