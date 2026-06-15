-- Criação da tabela para armazenar os valores do VAU (Valor Atualizado Unitário)
CREATE TABLE public.vau_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uf VARCHAR(2) NOT NULL,
    mes INTEGER NOT NULL,
    ano INTEGER NOT NULL,
    valor_alvenaria NUMERIC(10, 2) NOT NULL,
    valor_madeira NUMERIC(10, 2) NOT NULL,
    valor_mista NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Garante que não tenhamos duplicatas para o mesmo Estado, Mês e Ano
    CONSTRAINT vau_rates_unique_uf_mes_ano UNIQUE (uf, mes, ano)
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.vau_rates ENABLE ROW LEVEL SECURITY;

-- Política de leitura: qualquer usuário (autenticado ou não) pode ler as taxas para fazer cálculos
CREATE POLICY "Permitir leitura pública do VAU"
    ON public.vau_rates
    FOR SELECT
    TO public
    USING (true);

-- Política de escrita: apenas administradores ou a conta de serviço (Edge Function) podem inserir/atualizar
-- Como a automação rodará via Edge Function com Service Role Key, ela bypassa o RLS automaticamente.
-- Mas se quisermos permitir admins de mexer via frontend, podemos adicionar uma política extra aqui.
-- Por segurança, negaremos inserções públicas anônimas:
CREATE POLICY "Bloquear inserção/atualização anônima no VAU"
    ON public.vau_rates
    FOR ALL
    TO anon, authenticated
    USING (false)
    WITH CHECK (false);

-- Inserindo alguns dados de fallback iniciais baseados em Junho de 2026 para São Paulo (como estava no código)
INSERT INTO public.vau_rates (uf, mes, ano, valor_alvenaria, valor_madeira, valor_mista)
VALUES ('SP', 6, 2026, 2652.20, 1622.73, 2229.00)
ON CONFLICT (uf, mes, ano) DO NOTHING;
