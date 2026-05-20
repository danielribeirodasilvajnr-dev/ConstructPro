-- Execute este código no SQL Editor do Supabase para adicionar a coluna de incidência
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS incidence numeric DEFAULT 0;
