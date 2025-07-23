
-- Remove the foreign key constraint from farmers table since we're using custom auth
ALTER TABLE public.farmers DROP CONSTRAINT IF EXISTS farmers_id_fkey;

-- Also update the RLS policies to work without the auth.users reference
DROP POLICY IF EXISTS "Farmers can view own data via JWT" ON public.farmers;
DROP POLICY IF EXISTS "Farmers can update own data via JWT" ON public.farmers;
DROP POLICY IF EXISTS "Allow farmer registration" ON public.farmers;

-- Create new RLS policies that work with custom JWT tokens
CREATE POLICY "Farmers can view own data via JWT" 
ON public.farmers FOR SELECT 
USING (id::text = current_setting('request.jwt.claims', true)::json->>'farmer_id');

CREATE POLICY "Farmers can update own data via JWT" 
ON public.farmers FOR UPDATE 
USING (id::text = current_setting('request.jwt.claims', true)::json->>'farmer_id');

CREATE POLICY "Allow farmer registration" 
ON public.farmers FOR INSERT 
WITH CHECK (true);
