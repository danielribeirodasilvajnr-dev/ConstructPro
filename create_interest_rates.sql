CREATE TABLE IF NOT EXISTS interest_rates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  financing_type text UNIQUE NOT NULL,
  rate numeric NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE interest_rates ENABLE ROW LEVEL SECURITY;

-- Allow read access to all users (including anonymous for the simulator)
CREATE POLICY "Enable read access for all users" ON interest_rates FOR SELECT USING (true);

-- Allow write access to authenticated users only
CREATE POLICY "Enable insert access for authenticated users" ON interest_rates FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON interest_rates FOR UPDATE USING (auth.role() = 'authenticated');

-- Insert default rates
INSERT INTO interest_rates (financing_type, rate) VALUES ('Residencial', 9.5) ON CONFLICT (financing_type) DO UPDATE SET rate = EXCLUDED.rate;
INSERT INTO interest_rates (financing_type, rate) VALUES ('Comercial', 11.5) ON CONFLICT (financing_type) DO UPDATE SET rate = EXCLUDED.rate;
