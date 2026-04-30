const fs = require('fs');
const content = fs.readFileSync('d:/!DISCO LOCAL D - AREA DE PASTAS/PROJETOS DE APLICATIVOS/AevumPro/AevumPro/src/components/projects/INSSRegularizationTab.tsx', 'utf-8');

let stack = [];
let i = 0;
let line = 1;

while (i < content.length) {
    if (content[i] === '\n') {
        line++;
        i++;
        continue;
    }
    
    // Skip comments
    if (content.startsWith('//', i)) {
        while (i < content.length && content[i] !== '\n') i++;
        continue;
    }
    if (content.startsWith('/*', i)) {
        while (i < content.length && !content.startsWith('*/', i)) {
            if (content[i] === '\n') line++;
            i++;
        }
        i += 2;
        continue;
    }
    
    // Skip strings
    if (content[i] === '"' || content[i] === "'" || content[i] === '`') {
        let quote = content[i];
        i++;
        while (i < content.length && content[i] !== quote) {
            if (content[i] === '\\') i++;
            if (content[i] === '\n') line++;
            i++;
        }
        i++;
        continue;
    }
    
    // Match tags
    if (content[i] === '<') {
        let startLine = line;
        let tag = '';
        i++;
        while (i < content.length && content[i] !== '>') {
            if (content[i] === '\n') line++;
            tag += content[i];
            i++;
        }
        i++; // skip '>'
        
        let tagNameMatch = tag.match(/^\/?([a-zA-Z0-9]+)/);
        if (tagNameMatch) {
            let tagName = tagNameMatch[1].toLowerCase();
            let isClosing = tag.startsWith('/');
            let isSelfClosing = tag.endsWith('/');
            
            if (tagName === 'div' && !isSelfClosing) {
                if (isClosing) {
                    if (stack.length === 0) {
                        console.log('Extra closing div at line ' + startLine);
                    } else {
                        stack.pop();
                    }
                } else {
                    stack.push(startLine);
                }
            }
        }
        continue;
    }
    
    i++;
}

console.log('Final Stack Size: ' + stack.length);
if (stack.length > 0) {
    console.log('Unclosed divs opened at lines: ' + stack.join(', '));
}
