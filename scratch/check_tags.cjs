const fs = require('fs');
const content = fs.readFileSync('d:/!DISCO LOCAL D - AREA DE PASTAS/PROJETOS DE APLICATIVOS/AevumPro/AevumPro/src/components/projects/INSSRegularizationTab.tsx', 'utf-8');
const clean = content
  .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
  .replace(/'[^']*'|"[^"]*"|`[^`]*`/g, '');

let tags = [];
let regex = /<(\/?[a-zA-Z0-9]+)(?:\s+[^>]*?)?(\/?)>/g;
let match;
let lines = content.split('\n');

function getPos(index) {
  let count = 0;
  for (let i = 0; i < lines.length; i++) {
    if (count + lines[i].length >= index) {
      return { line: i + 1, col: index - count + 1 };
    }
    count += lines[i].length + 1;
  }
}

while ((match = regex.exec(clean)) !== null) {
  let tagName = match[1];
  let isClosing = tagName.startsWith('/');
  let isSelfClosing = match[2] === '/';
  
  if (isSelfClosing) continue;
  
  if (isClosing) {
    let name = tagName.substring(1);
    if (tags.length === 0 || tags[tags.length - 1].name !== name) {
      let pos = getPos(match.index);
      console.log('Mismatched closing tag </' + name + '> at line ' + pos.line + ', col ' + pos.col);
      // Don't exit, keep finding others
    } else {
      tags.pop();
    }
  } else {
    let pos = getPos(match.index);
    tags.push({ name: tagName, line: pos.line, col: pos.col });
  }
}

if (tags.length > 0) {
  tags.forEach(t => console.log('Unclosed <' + t.name + '> from line ' + t.line + ', col ' + t.col));
} else {
  console.log('All tags balanced!');
}
