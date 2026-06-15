require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ndkshctyncixxbbssfuc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('vau_rates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching vau_rates:', error);
  } else {
    console.log('vau_rates data:', JSON.stringify(data, null, 2));
  }
}

run();
