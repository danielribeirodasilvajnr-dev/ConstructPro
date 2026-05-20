-- Execute este código no SQL Editor do Supabase para adicionar a coluna de valor do contrato
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contract_value numeric DEFAULT 0;
