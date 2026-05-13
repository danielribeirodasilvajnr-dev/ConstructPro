
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: Variáveis do Supabase não encontradas no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateINCC() {
  console.log('Iniciando atualização do INCC (ESM)...');
  
  const aprilValue = 1259.652;
  const monthYear = '04/2026';

  const { data, error } = await supabase
    .from('incc_indices')
    .upsert([
      { month_year: monthYear, index_value: aprilValue }
    ], { onConflict: 'month_year' })
    .select();

  if (error) {
    console.error('Erro ao atualizar INCC:', error);
  } else {
    console.log('Sucesso! Índice de Abril/2026 atualizado:', data);
  }
}

updateINCC();
