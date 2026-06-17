-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Storage Bucket for Engineering Documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('engineering_docs', 'engineering_docs', false)
ON CONFLICT (id) DO NOTHING;

-- Policies for Storage Bucket "engineering_docs"
DROP POLICY IF EXISTS "Engineering Docs are viewable by authenticated users" ON storage.objects;
CREATE POLICY "Engineering Docs are viewable by authenticated users"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'engineering_docs' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Engineering Docs can be uploaded by authenticated users" ON storage.objects;
CREATE POLICY "Engineering Docs can be uploaded by authenticated users"
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'engineering_docs' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Engineering Docs can be deleted by authenticated users" ON storage.objects;
CREATE POLICY "Engineering Docs can be deleted by authenticated users"
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'engineering_docs' AND auth.role() = 'authenticated' );

-- 1. Engineering Disciplines
CREATE TABLE IF NOT EXISTS public.eng_disciplines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- Arquitetura, Estrutural, etc
    responsible_name VARCHAR(255),
    company VARCHAR(255),
    contact VARCHAR(255),
    start_date DATE,
    deadline DATE,
    status VARCHAR(50) DEFAULT 'Não iniciado', -- Não iniciado, Em desenvolvimento, Em análise, Em revisão, Aprovado, Liberado para obra
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 1.5 Engineering Directories (Folders)
CREATE TABLE IF NOT EXISTS public.eng_directories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    discipline_id UUID REFERENCES public.eng_disciplines(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.eng_directories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Engineering Documents
CREATE TABLE IF NOT EXISTS public.eng_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discipline_id UUID REFERENCES public.eng_disciplines(id) ON DELETE CASCADE,
    directory_id UUID REFERENCES public.eng_directories(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- PDF, DWG, IFC, etc
    version VARCHAR(20) DEFAULT 'REV00',
    responsible VARCHAR(255),
    notes TEXT,
    file_path TEXT NOT NULL, -- Supabase Storage Path
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Engineering Revisions (History)
CREATE TABLE IF NOT EXISTS public.eng_revisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES public.eng_documents(id) ON DELETE CASCADE,
    version VARCHAR(20) NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    changes_description TEXT,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Engineering Clash Detection (Compatibilização)
CREATE TABLE IF NOT EXISTS public.eng_clashes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    discipline1_id UUID NOT NULL REFERENCES public.eng_disciplines(id) ON DELETE CASCADE,
    discipline2_id UUID NOT NULL REFERENCES public.eng_disciplines(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    image_url TEXT,
    responsible VARCHAR(255),
    deadline DATE,
    status VARCHAR(50) DEFAULT 'Aberto', -- Aberto, Em análise, Em correção, Resolvido, Fechado
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Engineering RFIs (Ocorrências)
CREATE TABLE IF NOT EXISTS public.eng_rfis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    number SERIAL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100), -- Projeto, Estrutura, Arquitetura, etc
    priority VARCHAR(50) DEFAULT 'Média', -- Baixa, Média, Alta, Crítica
    responsible VARCHAR(255),
    deadline DATE,
    status VARCHAR(50) DEFAULT 'Aberto',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Engineering Approvals
CREATE TABLE IF NOT EXISTS public.eng_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES public.eng_documents(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    step VARCHAR(100), -- Elaboração, Envio, Análise, etc
    status VARCHAR(50), -- Aprovado, Reprovado
    comments TEXT,
    time_spent_hours NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. Engineering Deliverables (Entregáveis)
CREATE TABLE IF NOT EXISTS public.eng_deliverables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- Anteprojeto, Pré Executivo, etc
    planned_date DATE,
    actual_date DATE,
    responsible VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Pendente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS Policies

-- Enable RLS
ALTER TABLE public.eng_disciplines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eng_directories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eng_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eng_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eng_clashes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eng_rfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eng_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eng_deliverables ENABLE ROW LEVEL SECURITY;

-- Policies for eng_disciplines
DROP POLICY IF EXISTS "Users can view disciplines of their projects" ON public.eng_disciplines;
CREATE POLICY "Users can view disciplines of their projects" ON public.eng_disciplines
    FOR SELECT USING (
        project_id IN (
            SELECT project_id FROM public.project_collaborators WHERE user_id = auth.uid()
        ) OR project_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage disciplines of their projects" ON public.eng_disciplines;
CREATE POLICY "Users can manage disciplines of their projects" ON public.eng_disciplines
    FOR ALL USING (
        project_id IN (
            SELECT project_id FROM public.project_collaborators WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'engineer')
        ) OR project_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
        )
    );

-- Policies for eng_directories
DROP POLICY IF EXISTS "Users can view directories of their projects" ON public.eng_directories;
CREATE POLICY "Users can view directories of their projects" ON public.eng_directories
    FOR SELECT USING (
        project_id IN (
            SELECT project_id FROM public.project_collaborators WHERE user_id = auth.uid()
        ) OR project_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage directories of their projects" ON public.eng_directories;
CREATE POLICY "Users can manage directories of their projects" ON public.eng_directories
    FOR ALL USING (
        project_id IN (
            SELECT project_id FROM public.project_collaborators WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'engineer')
        ) OR project_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
        )
    );

-- Policies for eng_documents
DROP POLICY IF EXISTS "Users can view documents of their projects" ON public.eng_documents;
CREATE POLICY "Users can view documents of their projects" ON public.eng_documents
    FOR SELECT USING (
        project_id IN (
            SELECT project_id FROM public.project_collaborators WHERE user_id = auth.uid()
        ) OR project_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage documents of their projects" ON public.eng_documents;
CREATE POLICY "Users can manage documents of their projects" ON public.eng_documents
    FOR ALL USING (
        project_id IN (
            SELECT project_id FROM public.project_collaborators WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'engineer')
        ) OR project_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
        )
    );

-- Policies for eng_revisions
DROP POLICY IF EXISTS "Users can view revisions of their projects" ON public.eng_revisions;
CREATE POLICY "Users can view revisions of their projects" ON public.eng_revisions
    FOR SELECT USING (
        document_id IN (
            SELECT id FROM public.eng_documents WHERE project_id IN (
                SELECT project_id FROM public.project_collaborators WHERE user_id = auth.uid()
                UNION
                SELECT id FROM public.projects WHERE user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can manage revisions of their projects" ON public.eng_revisions;
CREATE POLICY "Users can manage revisions of their projects" ON public.eng_revisions
    FOR ALL USING (
        document_id IN (
            SELECT id FROM public.eng_documents WHERE project_id IN (
                SELECT project_id FROM public.project_collaborators WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'engineer')
                UNION
                SELECT id FROM public.projects WHERE user_id = auth.uid()
            )
        )
    );

-- Policies for eng_clashes
DROP POLICY IF EXISTS "Users can view clashes of their projects" ON public.eng_clashes;
CREATE POLICY "Users can view clashes of their projects" ON public.eng_clashes
    FOR SELECT USING (
        project_id IN (
            SELECT project_id FROM public.project_collaborators WHERE user_id = auth.uid()
        ) OR project_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage clashes of their projects" ON public.eng_clashes;
CREATE POLICY "Users can manage clashes of their projects" ON public.eng_clashes
    FOR ALL USING (
        project_id IN (
            SELECT project_id FROM public.project_collaborators WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'engineer')
        ) OR project_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
        )
    );

-- Policies for eng_rfis
DROP POLICY IF EXISTS "Users can view rfis of their projects" ON public.eng_rfis;
CREATE POLICY "Users can view rfis of their projects" ON public.eng_rfis
    FOR SELECT USING (
        project_id IN (
            SELECT project_id FROM public.project_collaborators WHERE user_id = auth.uid()
        ) OR project_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage rfis of their projects" ON public.eng_rfis;
CREATE POLICY "Users can manage rfis of their projects" ON public.eng_rfis
    FOR ALL USING (
        project_id IN (
            SELECT project_id FROM public.project_collaborators WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'engineer')
        ) OR project_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
        )
    );

-- Policies for eng_approvals
DROP POLICY IF EXISTS "Users can view approvals of their projects" ON public.eng_approvals;
CREATE POLICY "Users can view approvals of their projects" ON public.eng_approvals
    FOR SELECT USING (
        project_id IN (
            SELECT project_id FROM public.project_collaborators WHERE user_id = auth.uid()
        ) OR project_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage approvals of their projects" ON public.eng_approvals;
CREATE POLICY "Users can manage approvals of their projects" ON public.eng_approvals
    FOR ALL USING (
        project_id IN (
            SELECT project_id FROM public.project_collaborators WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'engineer')
        ) OR project_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
        )
    );

-- Policies for eng_deliverables
DROP POLICY IF EXISTS "Users can view deliverables of their projects" ON public.eng_deliverables;
CREATE POLICY "Users can view deliverables of their projects" ON public.eng_deliverables
    FOR SELECT USING (
        project_id IN (
            SELECT project_id FROM public.project_collaborators WHERE user_id = auth.uid()
        ) OR project_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage deliverables of their projects" ON public.eng_deliverables;
CREATE POLICY "Users can manage deliverables of their projects" ON public.eng_deliverables
    FOR ALL USING (
        project_id IN (
            SELECT project_id FROM public.project_collaborators WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'engineer')
        ) OR project_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
        )
    );
