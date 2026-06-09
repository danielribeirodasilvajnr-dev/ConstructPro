-- 1. Adicionar a coluna is_super_admin na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- 2. Atualize o SEU E-MAIL para ter acesso de Super Admin
-- Troque 'seu-email-aqui@exemplo.com' pelo seu e-mail real de login!
UPDATE public.profiles
SET is_super_admin = true
WHERE email = 'seu-email-aqui@exemplo.com';

-- 3. Atualizar a Política de Segurança (RLS) para permitir que Super Admins leiam todos os perfis
-- Remove política antiga se existir
DROP POLICY IF EXISTS "Super admins can read all profiles" ON public.profiles;

-- Cria a nova política garantindo que quem tem is_super_admin no profile consiga ler todos os dados
CREATE POLICY "Super admins can read all profiles" 
ON public.profiles FOR SELECT 
USING (
  -- Permite leitura se o usuário for o próprio, OU se for um super admin
  auth.uid() = id OR
  (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()) = true
);
