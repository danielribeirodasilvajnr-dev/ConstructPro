const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Fix Entrada de Energia + agua
  const { error: err1 } = await supabase
    .from('financial_items')
    .update({ observations: 'budget_sub_item_linked_id:3d48022c-7f14-43ab-a735-073e09f8e443|name:Entrada de energia + agua' })
    .eq('id', '4fc6a3bd-b93c-485f-a8ea-3175ab8292c6');
  
  if (err1) {
    console.error('Error fixing item 1:', err1);
  } else {
    console.log('Fixed item 1 successfully');
  }

  // Fix Barracão / Gabarito
  const { error: err2 } = await supabase
    .from('financial_items')
    .update({ observations: 'budget_sub_item_linked_id:ffc7fe89-2f08-4606-99b8-5c6697dc04f9|name:Barracão ' })
    .eq('id', 'f8871ce3-87f5-451e-a405-8e5dfbb0813a');

  if (err2) {
    console.error('Error fixing item 2:', err2);
  } else {
    console.log('Fixed item 2 successfully');
  }
}

run();
