const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const projectId = '26d706da-ed39-4031-ad23-18d9cc5b0c1a';
  const { data: budgetItems, error: bErr } = await supabase.from('budget_items').select('*').eq('project_id', projectId);
  if (bErr) {
    console.error('Budget items error:', bErr);
    return;
  }

  console.log('Total budget items in database:', budgetItems.length);
  budgetItems.forEach((item, index) => {
    console.log(`${index + 1}. Code: [${item.code}] | Category: [${item.category}] | Description: [${item.description}]`);
  });
}

run();
