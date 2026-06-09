-- Tabela de Planos
CREATE TABLE subscription_plans (
  id TEXT PRIMARY KEY, -- 'start', 'pro', 'elite', 'inss'
  name TEXT NOT NULL,
  max_projects INTEGER NOT NULL,
  max_regularizations INTEGER NOT NULL,
  access_projects BOOLEAN NOT NULL DEFAULT true,
  access_calculator BOOLEAN NOT NULL DEFAULT true,
  access_simulator BOOLEAN NOT NULL DEFAULT true
);

-- Inserir os planos iniciais
INSERT INTO subscription_plans (id, name, max_projects, max_regularizations, access_projects, access_calculator, access_simulator) VALUES
('start', 'START', 1, 1, true, true, true),
('pro', 'PRO', 3, 3, true, true, true),
('elite', 'ELITE', 10, 10, true, true, true),
('inss', 'INSS', 0, 999999, false, true, true)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  max_projects = EXCLUDED.max_projects,
  max_regularizations = EXCLUDED.max_regularizations,
  access_projects = EXCLUDED.access_projects;

-- Adicionar campo na tabela profiles
ALTER TABLE profiles ADD COLUMN plan_id TEXT REFERENCES subscription_plans(id) DEFAULT 'start';

-- Atualizar perfis existentes para o plano START se estiverem nulos
UPDATE profiles SET plan_id = 'start' WHERE plan_id IS NULL;

-- Atualizar Policies se necessário
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on subscription_plans" 
  ON subscription_plans FOR SELECT TO public USING (true);
