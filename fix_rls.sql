-- Correção do erro de recursão infinita no RLS do Supabase

-- 1. Primeiro apagamos a política problemática
DROP POLICY IF EXISTS "Super admins can read all profiles" ON public.profiles;

-- 2. Criamos uma função segura (SECURITY DEFINER) para checar o status de admin
-- Isso impede que o banco de dados entre em "loop" infinito ao ler a própria tabela
CREATE OR REPLACE FUNCTION public.check_is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  SELECT is_super_admin FROM public.profiles WHERE id = auth.uid();
$$;

-- 3. Recriamos a política usando a função segura
CREATE POLICY "Super admins can read all profiles" 
ON public.profiles FOR SELECT 
USING (
  auth.uid() = id OR 
  public.check_is_super_admin()
);
