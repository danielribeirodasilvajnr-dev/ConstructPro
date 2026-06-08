const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, '../src');

const replacements = [
  { regex: /text-slate-200/g, replacement: 'text-on-surface' },
  { regex: /text-slate-700/g, replacement: 'text-on-surface-variant' },
  { regex: /text-slate-800/g, replacement: 'text-on-surface' },
  { regex: /text-slate-900/g, replacement: 'text-on-surface' },
  { regex: /bg-slate-100/g, replacement: 'bg-surface-container-low' },
  { regex: /border-slate-100/g, replacement: 'border-outline-variant' },
  { regex: /border-slate-300/g, replacement: 'border-outline' },
  { regex: /border-t-slate-300/g, replacement: 'border-t-outline' },
  { regex: /border-slate-500/g, replacement: 'border-outline' },
  { regex: /bg-[#D3E3F5]/ig, replacement: 'bg-surface-container-highest' },
  { regex: /hover:bg-slate-50/g, replacement: 'hover:bg-surface-container-low' },
  { regex: /hover:bg-slate-700/g, replacement: 'hover:opacity-90' }, // For buttons
  { regex: /placeholder:text-slate-700/g, replacement: 'placeholder:text-on-surface-variant' },
  { regex: /shadow-black\/20/g, replacement: 'shadow-sm' },
  { regex: /shadow-black\/30/g, replacement: 'shadow-sm' },
  { regex: /bg-[#22ff88]\/10/ig, replacement: 'bg-primary/10' },
  { regex: /text-[#22ff88]/ig, replacement: 'text-primary' },
  { regex: /border-[#22ff88]\/20/ig, replacement: 'border-primary/20' }
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let originalContent = content;

      for (const { regex, replacement } of replacements) {
        content = content.replace(regex, replacement);
      }

      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
      }
    }
  }
}

processDirectory(directoryPath);
console.log('Replacement pass 3 complete.');
