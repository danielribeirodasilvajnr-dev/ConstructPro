const fs = require('fs');
const content = fs.readFileSync('d:/!DISCO LOCAL D - AREA DE PASTAS/PROJETOS DE APLICATIVOS/AevumPro/AevumPro/src/components/projects/INSSRegularizationTab.tsx', 'utf-8');
const clean = content
  .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
  .replace(/'[^']*'|"[^"]*"|`[^`]*`/g, '');
let stack = [];
let lines = clean.split('\n');
for (let i = 0; i < lines.length; i++) {
  for (let j = 0; j < lines[i].length; j++) {
    let char = lines[i][j];
    if (char === '{') stack.push({char, line: i + 1, col: j + 1});
    else if (char === '}') {
      if (stack.length === 0 || stack[stack.length - 1].char !== '{') {
        console.log('Mismatched } at line ' + (i + 1) + ', col ' + (j + 1));
        process.exit(0);
      }
      stack.pop();
    } else if (char === '(') stack.push({char, line: i + 1, col: j + 1});
    else if (char === ')') {
      if (stack.length === 0 || stack[stack.length - 1].char !== '(') {
        console.log('Mismatched ) at line ' + (i + 1) + ', col ' + (j + 1));
        process.exit(0);
      }
      stack.pop();
    }
  }
}
if (stack.length > 0) {
  stack.forEach(s => console.log('Unclosed ' + s.char + ' from line ' + s.line + ', col ' + s.col));
} else {
  console.log('All balanced!');
}
