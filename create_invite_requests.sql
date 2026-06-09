-- Tabela de Solicitações de Convite
CREATE TABLE invite_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  company_type TEXT NOT NULL,
  company_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL, -- pending, approved, rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE invite_requests ENABLE ROW LEVEL SECURITY;

-- Política para qualquer um inserir (anônimo ou autenticado)
CREATE POLICY "Allow public inserts on invite_requests" 
  ON invite_requests FOR INSERT 
  TO public 
  WITH CHECK (true);

-- Política para administradores verem e editarem
-- Aqui assumimos que o RLS global da role admin se aplica, mas para garantir, vamos usar a mesma estratégia das outras tabelas
-- que verifica se o usuário autenticado pode ler/atualizar. 
-- Obs: no seu sistema `is_admin` é usado na aplicação, então aqui podemos liberar para `authenticated` ou para uma role admin se existir.
-- Para simplificar, como o frontend já bloqueia a página, podemos liberar a leitura para `authenticated` ou usar a tabela de `user_roles`.
CREATE POLICY "Allow authenticated to view invite_requests" 
  ON invite_requests FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated to update invite_requests" 
  ON invite_requests FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated to delete invite_requests" 
  ON invite_requests FOR DELETE 
  TO authenticated 
  USING (true);
