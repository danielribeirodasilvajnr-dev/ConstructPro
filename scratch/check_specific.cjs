const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const mainBudgetItemId = '45550458-44be-4714-8eaf-6a71aa72227b';

  // 1. Fetch current sub-items
  const { data: subItems } = await supabase.from('budget_sub_items').select('*').eq('budget_item_id', mainBudgetItemId);
  console.log('--- Budget Sub-Items for BudgetItem ID: ' + mainBudgetItemId + ' ---');
  subItems.forEach(s => {
    console.log(`- SubItem ID: ${s.id} | Desc: ${s.description} | Parent: ${s.budget_item_id}`);
  });

  // 2. Fetch financial items linked to this budget item
  const { data: financialItems } = await supabase.from('financial_items').select('*').eq('budget_item_linked_id', mainBudgetItemId);
  console.log('\n--- Financial Items linked to BudgetItem ID: ' + mainBudgetItemId + ' ---');
  financialItems.forEach(f => {
    console.log(`- Financial ID: ${f.id} | Desc: ${f.description} | amount: ${f.amount} | Obs: ${f.observations}`);
  });
}

run();
