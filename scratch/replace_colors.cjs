const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, '../src');

const replacements = [
  // Backgrounds
  { regex: /bg-\[#1C232E\]/g, replacement: 'bg-surface' },
  { regex: /bg-\[#0b0f19\]/g, replacement: 'bg-surface-container-low' },
  { regex: /bg-slate-900\/50/g, replacement: 'bg-surface-container-low' },
  { regex: /bg-slate-900/g, replacement: 'bg-surface' },
  { regex: /bg-slate-800\/50/g, replacement: 'bg-surface-container-high' },
  { regex: /bg-slate-800/g, replacement: 'bg-surface-container-high' },
  { regex: /bg-white\/5/g, replacement: 'bg-surface-container-low' },
  { regex: /bg-white\/10/g, replacement: 'bg-surface-container-high' },
  { regex: /hover:bg-white\/5/g, replacement: 'hover:bg-surface-container-low' },
  { regex: /hover:bg-white\/10/g, replacement: 'hover:bg-surface-container-high' },
  { regex: /hover:bg-slate-800/g, replacement: 'hover:bg-surface-container-high' },
  { regex: /bg-black\/50/g, replacement: 'bg-surface-container-highest/50' },
  { regex: /bg-black\/20/g, replacement: 'bg-surface-container-highest/20' },

  // Text Colors
  { regex: /text-white/g, replacement: 'text-on-surface' },
  { regex: /text-slate-100/g, replacement: 'text-on-surface' },
  { regex: /text-slate-300/g, replacement: 'text-on-surface-variant' },
  { regex: /text-slate-400/g, replacement: 'text-on-surface-variant' },
  { regex: /text-slate-500/g, replacement: 'text-on-surface-variant' },
  { regex: /text-gray-400/g, replacement: 'text-on-surface-variant' },
  { regex: /text-gray-500/g, replacement: 'text-on-surface-variant' },
  { regex: /text-slate-600/g, replacement: 'text-on-surface-variant' },

  // Borders
  { regex: /border-white\/5/g, replacement: 'border-outline' },
  { regex: /border-white\/10/g, replacement: 'border-outline' },
  { regex: /border-white\/20/g, replacement: 'border-outline-variant' },
  { regex: /border-slate-800/g, replacement: 'border-outline' },
  { regex: /border-slate-700/g, replacement: 'border-outline-variant' },
  { regex: /hover:border-white\/20/g, replacement: 'hover:border-outline-variant' },

  // Other classes
  { regex: /shadow-\[0_0_10px_rgba\(34\,255\,136\,0\.2\)\]/g, replacement: 'shadow-sm border-primary/20' }
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
console.log('Replacement complete.');
