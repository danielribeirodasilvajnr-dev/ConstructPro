const fs = require('fs');
const file = 'src/components/projects/INSSRegularizationTab.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('invokeProxy')) {
  const insertIndex = content.indexOf('export function INSSRegularizationTab');
  const helper = `
// FUNÇÃO PROXY LOCAL PARA MTLS NO NODE.JS
async function invokeProxy(options: any) {
  try {
    const response = await fetch('http://localhost:3005/esocial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options.body)
    });
    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

`;
  content = content.slice(0, insertIndex) + helper + content.slice(insertIndex);
}

content = content.replace(/await supabase\.functions\.invoke\('esocial-transmission-v3-real', /g, 'await invokeProxy(');
content = content.replace(/await supabase\.functions\.invoke\('esocial-transmission-v2', /g, 'await invokeProxy(');

fs.writeFileSync(file, content);
console.log('Frontend atualizado para usar o Node.js proxy!');
