-- Create budget_sub_items table
CREATE TABLE IF NOT EXISTS public.budget_sub_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    budget_item_id UUID NOT NULL REFERENCES public.budget_items(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    percentage NUMERIC, -- calculated field
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_budget_sub_items_budget_item_id ON public.budget_sub_items(budget_item_id);

-- Add RLS policies (assuming public access or similar to budget_items)
ALTER TABLE public.budget_sub_items ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users or anon (depending on your setup)
CREATE POLICY "Enable read access for all users" ON public.budget_sub_items FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.budget_sub_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.budget_sub_items FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for all users" ON public.budget_sub_items FOR DELETE USING (true);
