require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ndkshctyncixxbbssfuc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*');

  if (projectsError || !projects || projects.length === 0) {
    console.log('Project not found', projectsError);
    return;
  }
  
  projects.forEach(p => console.log(`ID: ${p.id}, Name: ${p.name}, Client: ${p.client}, Area: ${p.area}, Location: ${p.location}`));
  
  const project = projects.find(p => p.area == 155 || p.client === 'Marcelino' || (p.client && p.client.includes('Marcelino')));
  
  if (!project) {
    console.log('Target project not found');
    return;
  }

  console.log(`Found Project: ${project.name} (ID: ${project.id})`);
  console.log(`Project Contract Value: ${project.contract_value}`);

  const { data: budgetItems } = await supabase
    .from('budget_items')
    .select('*')
    .eq('project_id', project.id);

  const { data: financialItems } = await supabase
    .from('financial_items')
    .select('*')
    .eq('project_id', project.id);

  const totalInvested = financialItems.reduce((acc, item) => acc + Number(item.amount), 0);
  const totalEntradas = financialItems.filter(i => i.category === 'Entrada').reduce((acc, item) => acc + Number(item.amount), 0);
  const totalSaidas = financialItems.filter(i => i.category !== 'Entrada').reduce((acc, item) => acc + Number(item.amount), 0);
  const totalBudget = (budgetItems || []).reduce((acc, item) => acc + (Number(item.quantity) * Number(item.unit_cost)), 0);
  
  console.log(`Total Everything: ${totalInvested}`);
  console.log(`Total Entradas (Aporte Total): ${totalEntradas}`);
  console.log(`Total Saidas (Gastos): ${totalSaidas}`);
  console.log(`Total Budget (Valor do Contrato): ${totalBudget}`);
  
  const physicalProgress = totalBudget > 0 ? (totalInvested / totalBudget) * 100 : 0;
  console.log(`Calculated Physical Progress: ${physicalProgress}%`);
}

run();
