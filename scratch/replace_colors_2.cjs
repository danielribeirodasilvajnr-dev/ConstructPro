const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, '../src');

const replacements = [
  // Backgrounds
  { regex: /bg-\[#1C232E\]/ig, replacement: 'bg-surface' },
  { regex: /bg-\[#0B0F19\](\/\d+)?/ig, replacement: 'bg-surface-container-low$1' },
  { regex: /bg-\[#2B3647\]/ig, replacement: 'bg-surface-container-high' },
  { regex: /bg-\[#BCB5AC\]/ig, replacement: 'bg-primary' },
  { regex: /bg-\[#10B981\](\/\d+)?/ig, replacement: 'bg-success$1' },
  { regex: /bg-\[#0275d8\]/ig, replacement: 'bg-secondary' },
  { regex: /bg-\[#025aa5\]/ig, replacement: 'bg-primary' },
  { regex: /bg-[#059669]/ig, replacement: 'bg-success' },
  
  // Text Colors
  { regex: /text-\[#1C232E\]/ig, replacement: 'text-on-primary' },
  { regex: /text-\[#BCB5AC\]/ig, replacement: 'text-primary' },
  { regex: /text-\[#10B981\]/ig, replacement: 'text-success' },
  
  // Borders
  { regex: /border-\[#BCB5AC\](\/\d+)?/ig, replacement: 'border-primary$1' },
  { regex: /border-\[#10B981\](\/\d+)?/ig, replacement: 'border-success$1' },
  { regex: /shadow-\[#10B981\](\/\d+)?/ig, replacement: 'shadow-success$1' },
  { regex: /focus:border-\[#BCB5AC\]/ig, replacement: 'focus:border-primary' },
  { regex: /focus:border-\[#10B981\]/ig, replacement: 'focus:border-success' },
  
  // Leftovers
  { regex: /hover:border-\[#BCB5AC\](\/\d+)?/ig, replacement: 'hover:border-primary$1' },
  { regex: /group-hover:text-\[#BCB5AC\]/ig, replacement: 'group-hover:text-primary' }
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
console.log('Replacement pass 2 complete.');
