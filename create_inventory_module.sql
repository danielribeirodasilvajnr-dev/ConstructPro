-- ==========================================
-- MÓDULO: CONTROLE DE ESTOQUE (ALMOXARIFADO)
-- ==========================================

-- 1. Tabela de Materiais
CREATE TABLE inventory_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    code VARCHAR(50),
    description VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    min_stock NUMERIC DEFAULT 0,
    ideal_stock NUMERIC DEFAULT 0,
    current_stock NUMERIC DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Funcionários da Obra (para Cautelas)
CREATE TABLE inventory_employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Movimentações de Estoque
CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES inventory_materials(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('in', 'out', 'cautela', 'adjustment')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    quantity NUMERIC NOT NULL,
    
    -- Dados de Entrada
    unit_price NUMERIC,
    total_price NUMERIC,
    supplier VARCHAR(255),
    invoice_url TEXT,
    storage_location VARCHAR(255),
    financial_item_id UUID REFERENCES financial_items(id) ON DELETE SET NULL,
    
    -- Dados de Saída/Consumo (EAP)
    budget_item_id UUID REFERENCES budget_items(id) ON DELETE SET NULL,
    budget_sub_item_id UUID REFERENCES budget_sub_items(id) ON DELETE SET NULL,
    
    -- Dados de Cautela
    employee_id UUID REFERENCES inventory_employees(id) ON DELETE SET NULL,
    destination VARCHAR(255),
    
    -- Dados Gerais
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Função e Trigger para Atualização Automática do Saldo (current_stock)
CREATE OR REPLACE FUNCTION update_inventory_material_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.type = 'in' OR NEW.type = 'adjustment' THEN
            UPDATE inventory_materials
            SET current_stock = current_stock + NEW.quantity, updated_at = NOW()
            WHERE id = NEW.material_id;
        ELSIF NEW.type = 'out' OR NEW.type = 'cautela' THEN
            UPDATE inventory_materials
            SET current_stock = current_stock - NEW.quantity, updated_at = NOW()
            WHERE id = NEW.material_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.type = 'in' OR OLD.type = 'adjustment' THEN
            UPDATE inventory_materials
            SET current_stock = current_stock - OLD.quantity, updated_at = NOW()
            WHERE id = OLD.material_id;
        ELSIF OLD.type = 'out' OR OLD.type = 'cautela' THEN
            UPDATE inventory_materials
            SET current_stock = current_stock + OLD.quantity, updated_at = NOW()
            WHERE id = OLD.material_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Reverter o OLD
        IF OLD.type = 'in' OR OLD.type = 'adjustment' THEN
            UPDATE inventory_materials SET current_stock = current_stock - OLD.quantity WHERE id = OLD.material_id;
        ELSIF OLD.type = 'out' OR OLD.type = 'cautela' THEN
            UPDATE inventory_materials SET current_stock = current_stock + OLD.quantity WHERE id = OLD.material_id;
        END IF;
        
        -- Aplicar o NEW
        IF NEW.type = 'in' OR NEW.type = 'adjustment' THEN
            UPDATE inventory_materials SET current_stock = current_stock + NEW.quantity, updated_at = NOW() WHERE id = NEW.material_id;
        ELSIF NEW.type = 'out' OR NEW.type = 'cautela' THEN
            UPDATE inventory_materials SET current_stock = current_stock - NEW.quantity, updated_at = NOW() WHERE id = NEW.material_id;
        END IF;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inventory_stock
AFTER INSERT OR UPDATE OR DELETE ON inventory_movements
FOR EACH ROW EXECUTE FUNCTION update_inventory_material_stock();

-- 5. RLS (Row Level Security)

-- Ativar RLS
ALTER TABLE inventory_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

-- Políticas baseadas nos projetos do usuário (simplificado para admin/donos)
-- Para inventory_materials
CREATE POLICY "Users can view inventory_materials of their projects"
ON inventory_materials FOR SELECT
USING (
  project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()) OR
  project_id IN (SELECT project_id FROM project_collaborators WHERE user_id = auth.uid())
);

CREATE POLICY "Users can insert inventory_materials to their projects"
ON inventory_materials FOR INSERT
WITH CHECK (
  project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()) OR
  project_id IN (SELECT project_id FROM project_collaborators WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update inventory_materials of their projects"
ON inventory_materials FOR UPDATE
USING (
  project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()) OR
  project_id IN (SELECT project_id FROM project_collaborators WHERE user_id = auth.uid())
);

CREATE POLICY "Users can delete inventory_materials of their projects"
ON inventory_materials FOR DELETE
USING (
  project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()) OR
  project_id IN (SELECT project_id FROM project_collaborators WHERE user_id = auth.uid())
);

-- Para inventory_employees
CREATE POLICY "Users can view inventory_employees of their projects"
ON inventory_employees FOR SELECT
USING (
  project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()) OR
  project_id IN (SELECT project_id FROM project_collaborators WHERE user_id = auth.uid())
);

CREATE POLICY "Users can insert inventory_employees to their projects"
ON inventory_employees FOR INSERT
WITH CHECK (
  project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()) OR
  project_id IN (SELECT project_id FROM project_collaborators WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update inventory_employees of their projects"
ON inventory_employees FOR UPDATE
USING (
  project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()) OR
  project_id IN (SELECT project_id FROM project_collaborators WHERE user_id = auth.uid())
);

CREATE POLICY "Users can delete inventory_employees of their projects"
ON inventory_employees FOR DELETE
USING (
  project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()) OR
  project_id IN (SELECT project_id FROM project_collaborators WHERE user_id = auth.uid())
);

-- Para inventory_movements
CREATE POLICY "Users can view inventory_movements of their projects"
ON inventory_movements FOR SELECT
USING (
  project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()) OR
  project_id IN (SELECT project_id FROM project_collaborators WHERE user_id = auth.uid())
);

CREATE POLICY "Users can insert inventory_movements to their projects"
ON inventory_movements FOR INSERT
WITH CHECK (
  project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()) OR
  project_id IN (SELECT project_id FROM project_collaborators WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update inventory_movements of their projects"
ON inventory_movements FOR UPDATE
USING (
  project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()) OR
  project_id IN (SELECT project_id FROM project_collaborators WHERE user_id = auth.uid())
);

CREATE POLICY "Users can delete inventory_movements of their projects"
ON inventory_movements FOR DELETE
USING (
  project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()) OR
  project_id IN (SELECT project_id FROM project_collaborators WHERE user_id = auth.uid())
);
