import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
  console.log('Fetching financial_items with category Mão de Obra...');
  const { data: items, error: fetchErr } = await supabase
    .from('financial_items')
    .select('*')
    .ilike('category', 'mão de obra');

  if (fetchErr) {
    console.error('Error fetching items:', fetchErr);
    return;
  }

  console.log(`Found ${items?.length || 0} items with category 'Mão de Obra'`);

  if (items && items.length > 0) {
    const { data: updated, error: updateErr } = await supabase
      .from('financial_items')
      .update({ category: 'Terceirizado' })
      .ilike('category', 'mão de obra')
      .select();

    if (updateErr) {
      console.error('Error updating items:', updateErr);
    } else {
      console.log(`Successfully updated ${updated?.length || 0} items to 'Terceirizado':`);
      updated.forEach(item => {
        console.log(` - ID: ${item.id} | Desc: ${item.description} | Date: ${item.date} | Amount: ${item.amount}`);
      });
    }
  }
}

run();
