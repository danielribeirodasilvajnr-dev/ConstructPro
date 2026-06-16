const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const projectId = '26d706da-ed39-4031-ad23-18d9cc5b0c1a';

  // Find budget items
  const { data: budgetItems, error: bErr } = await supabase.from('budget_items').select('*').eq('project_id', projectId);
  if (bErr) {
    console.error('Budget items error:', bErr);
    return;
  }

  console.log('\nBudget Items count:', budgetItems.length);
  console.log('Budget Items:');
  budgetItems.forEach(item => {
    console.log(`- ID: ${item.id} | Code: ${item.code} | Category: ${item.category} | Description: ${item.description}`);
  });

  // Find financial items
  const { data: financialItems, error: fErr } = await supabase.from('financial_items').select('*').eq('project_id', projectId);
  if (fErr) {
    console.error('Financial items error:', fErr);
    return;
  }
  console.log('\nFinancial Items count:', financialItems.length);
  console.log('Financial Items:');
  financialItems.forEach(item => {
    console.log(`- ID: ${item.id} | Desc: ${item.description} | Linked BudgetItem ID: ${item.budget_item_linked_id}`);
  });
}

run();
