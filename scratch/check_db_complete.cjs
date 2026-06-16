const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const projectId = '26d706da-ed39-4031-ad23-18d9cc5b0c1a';

  // 1. Fetch current sub-items
  const { data: subItems } = await supabase.from('budget_sub_items').select('*');
  console.log('--- Current Budget Sub-Items ---');
  subItems.forEach(s => {
    console.log(`- SubItem ID: ${s.id} | Desc: ${s.description} | Parent BudgetItem ID: ${s.budget_item_id}`);
  });

  // 2. Fetch financial items
  const { data: financialItems } = await supabase.from('financial_items').select('*').eq('project_id', projectId);
  console.log('\n--- Financial Items ---');
  financialItems.forEach(f => {
    console.log(`- Financial ID: ${f.id} | Desc: ${f.description} | amount: ${f.amount} | Linked BudgetItem ID: ${f.budget_item_linked_id} | Obs: ${f.observations}`);
  });
}

run();
