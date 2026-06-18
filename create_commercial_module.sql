-- ==========================================
-- SCRIPT DE CRIAÇÃO DO MÓDULO COMERCIAL
-- ==========================================

-- 1. Commercial Clients (CRM)
CREATE TABLE IF NOT EXISTS public.com_clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('PF', 'PJ')),
    name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255), -- Nome fantasia (se PJ)
    document VARCHAR(20) NOT NULL, -- CPF ou CNPJ
    email VARCHAR(255),
    phone VARCHAR(20),
    responsible VARCHAR(255), -- Responsável (se PJ)
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Commercial Compositions (Banco de Preços/Composições)
CREATE TABLE IF NOT EXISTS public.com_compositions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code VARCHAR(50),
    description VARCHAR(255) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    material_cost NUMERIC(12, 2) DEFAULT 0,
    labor_cost NUMERIC(12, 2) DEFAULT 0,
    equipment_cost NUMERIC(12, 2) DEFAULT 0,
    third_party_cost NUMERIC(12, 2) DEFAULT 0,
    total_cost NUMERIC(12, 2) GENERATED ALWAYS AS (material_cost + labor_cost + equipment_cost + third_party_cost) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Commercial Budgets (Orçamentos)
CREATE TABLE IF NOT EXISTS public.com_budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.com_clients(id) ON DELETE CASCADE,
    number VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Rascunho' CHECK (status IN ('Rascunho', 'Enviado', 'Em negociação', 'Aprovado', 'Reprovado', 'Cancelado')),
    validity_days INTEGER DEFAULT 15,
    execution_prazo VARCHAR(100),
    responsible_tech VARCHAR(255),
    bdi_percent NUMERIC(5, 2) DEFAULT 0,
    taxes_percent NUMERIC(5, 2) DEFAULT 0,
    profit_percent NUMERIC(5, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Commercial Budget Items (EAP do Orçamento)
CREATE TABLE IF NOT EXISTS public.com_budget_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES public.com_budgets(id) ON DELETE CASCADE,
    composition_id UUID REFERENCES public.com_compositions(id) ON DELETE SET NULL, -- Se usou composição do banco
    code VARCHAR(50), -- Ex: 01.01
    description VARCHAR(255) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL DEFAULT 1,
    material_cost NUMERIC(12, 2) DEFAULT 0,
    labor_cost NUMERIC(12, 2) DEFAULT 0,
    equipment_cost NUMERIC(12, 2) DEFAULT 0,
    third_party_cost NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Commercial Contract Templates (Modelos de Contrato)
CREATE TABLE IF NOT EXISTS public.com_contract_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL, -- Rich text contendo as variáveis
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Commercial Contracts (Contratos Emitidos)
CREATE TABLE IF NOT EXISTS public.com_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    budget_id UUID NOT NULL REFERENCES public.com_budgets(id) ON DELETE CASCADE,
    template_id UUID REFERENCES public.com_contract_templates(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Minuta' CHECK (status IN ('Minuta', 'Enviado para Assinatura', 'Assinado', 'Cancelado')),
    content TEXT NOT NULL, -- Conteúdo do contrato preenchido
    signature_url VARCHAR(255), -- Link do DocuSign/Clicksign
    signed_document_url VARCHAR(255), -- Arquivo final assinado
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.com_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.com_compositions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.com_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.com_budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.com_contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.com_contracts ENABLE ROW LEVEL SECURITY;

-- POLICIES (Users can only see and manage their own commercial data)
DROP POLICY IF EXISTS "Users can manage their own com_clients" ON public.com_clients;
CREATE POLICY "Users can manage their own com_clients" ON public.com_clients FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own com_compositions" ON public.com_compositions;
CREATE POLICY "Users can manage their own com_compositions" ON public.com_compositions FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own com_budgets" ON public.com_budgets;
CREATE POLICY "Users can manage their own com_budgets" ON public.com_budgets FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own com_budget_items" ON public.com_budget_items;
CREATE POLICY "Users can manage their own com_budget_items" ON public.com_budget_items 
    FOR ALL USING (
        budget_id IN (SELECT id FROM public.com_budgets WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can manage their own com_contract_templates" ON public.com_contract_templates;
CREATE POLICY "Users can manage their own com_contract_templates" ON public.com_contract_templates FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own com_contracts" ON public.com_contracts;
CREATE POLICY "Users can manage their own com_contracts" ON public.com_contracts FOR ALL USING (user_id = auth.uid());
