import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('d:/!DISCO LOCAL D - AREA DE PASTAS/PROJETOS DE APLICATIVOS/360Pro/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function fix() {
  console.log("Checking duplicates...");
  
  // Get all budget_items for the specific bid group
  const bidGroupId = 'e42f3bb1-4ba2-404c-83b6-200ca162a8ed'; // We don't know the ID, let's query by description or just get all and find duplicates.
  // Wait, let's just find budget_items with duplicates
  const { data: items, error } = await supabase.from('budget_items').select('*');
  if (error) { console.error(error); return; }

  const counts: Record<string, any[]> = {};
  for (const item of items) {
    if (item.bid_group_id) {
       const key = `${item.bid_group_id}_${item.description}`;
       if (!counts[key]) counts[key] = [];
       counts[key].push(item);
    }
  }

  for (const [key, list] of Object.entries(counts)) {
    if (list.length > 1) {
      console.log(`Found ${list.length} duplicates for ${key}`);
      // Keep the first one, delete the rest
      const toDelete = list.slice(1).map(i => i.id);
      const { error: delErr } = await supabase.from('budget_items').delete().in('id', toDelete);
      if (delErr) {
        console.error("Error deleting", delErr);
      } else {
        console.log("Deleted", toDelete.length, "duplicates");
      }
    }
  }

  // Check quotes to see why price is 0
  const { data: bidGroups } = await supabase.from('bid_groups').select('*, items:bid_group_items(*), quotes:bid_quotes(*, quote_items:bid_quote_items(*)), budget_items:bid_budget_items(*)');
  if (bidGroups) {
    for (const bg of bidGroups) {
      if (bg.title?.includes('GRIMALDO')) {
         console.log("Group:", bg.title);
         const winner = bg.quotes?.find((q: any) => q.is_selected);
         console.log("Winner:", winner?.id);
         console.log("Winner quotes:", winner?.quote_items);
         
         // Update the unit cost of the zero items if they should have price
         const { data: groupBudgetItems } = await supabase.from('budget_items').select('*').eq('bid_group_id', bg.id);
         for (const gbi of groupBudgetItems || []) {
           if (gbi.unit_cost === 0 && winner) {
              const itemMatches = bg.items?.find((i:any) => i.description === gbi.description);
              if (itemMatches) {
                 const qItem = winner.quote_items?.find((qi:any) => qi.bid_group_item_id === itemMatches.id);
                 if (qItem) {
                    console.log(`Fixing ${gbi.description} to ${qItem.unit_price}`);
                    await supabase.from('budget_items').update({ unit_cost: qItem.unit_price }).eq('id', gbi.id);
                 }
              }
           }
         }
      }
    }
  }
}

fix();
