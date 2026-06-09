ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT,
ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'pending' CHECK (subscription_status IN ('pending', 'active', 'expired')),
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT,
ADD COLUMN IF NOT EXISTS asaas_subscription_id TEXT;

-- 2. Create Terms Acceptance table
CREATE TABLE IF NOT EXISTS terms_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  accepted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_user_terms UNIQUE (user_id)
);

-- 3. Enable RLS on terms_acceptances
ALTER TABLE terms_acceptances ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own terms acceptance
CREATE POLICY "Users can insert their own terms acceptance" 
ON terms_acceptances FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can read their own terms acceptance
CREATE POLICY "Users can read their own terms acceptance" 
ON terms_acceptances FOR SELECT 
USING (auth.uid() = user_id);

-- 4. Update the trigger function handle_new_user to ensure default status is 'pending'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    plan_id, 
    subscription_status
  )
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    'start',
    'pending'
  );
  RETURN new;
END;
$$;
