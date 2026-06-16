const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const projectId = '26d706da-ed39-4031-ad23-18d9cc5b0c1a';
  const { data: financialItems, error: fErr } = await supabase.from('financial_items').select('*').limit(1);
  if (fErr) {
    console.error('Financial items error:', fErr);
    return;
  }
  if (financialItems.length === 0) {
    console.log('No financial items found');
  } else {
    console.log('Columns in financial_items:', Object.keys(financialItems[0]));
    console.log('Sample row:', financialItems[0]);
  }
}

run();
