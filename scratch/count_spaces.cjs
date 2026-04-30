const fs = require('fs');
const content = fs.readFileSync('d:/!DISCO LOCAL D - AREA DE PASTAS/PROJETOS DE APLICATIVOS/AevumPro/AevumPro/src/components/projects/INSSRegularizationTab.tsx', 'utf-8');
const lines = content.split('\n');

for (let i = 2737; i < 3205; i++) {
  let line = lines[i];
  let spaces = line.match(/^ */)[0].length;
  console.log((i+1) + ' (' + spaces + '): ' + line.trim());
}
