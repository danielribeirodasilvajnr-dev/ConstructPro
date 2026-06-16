const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: 'ALTER TABLE public.financial_items ADD COLUMN IF NOT EXISTS budget_sub_item_linked_id UUID REFERENCES public.budget_sub_items(id) ON DELETE SET NULL;' 
    });
    if (error) {
      console.log('RPC exec_sql failed:', error.message);
    } else {
      console.log('RPC exec_sql succeeded! Data:', data);
    }
  } catch (err) {
    console.log('Catch block error:', err.message);
  }
}

run();
