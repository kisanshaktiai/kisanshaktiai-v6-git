
-- Make tenant_id optional in farmers table and update constraints
ALTER TABLE public.farmers 
  ALTER COLUMN tenant_id DROP NOT NULL;

-- Update the unique constraint to allow multiple records with same mobile_number when tenant_id is NULL
DROP INDEX IF EXISTS farmers_tenant_mobile_unique;

-- Create a new unique constraint that only applies when tenant_id is NOT NULL
CREATE UNIQUE INDEX farmers_tenant_mobile_unique 
ON public.farmers (tenant_id, mobile_number) 
WHERE tenant_id IS NOT NULL AND mobile_number IS NOT NULL;

-- Create a separate unique constraint for mobile_number when tenant_id is NULL
CREATE UNIQUE INDEX farmers_mobile_unique_no_tenant 
ON public.farmers (mobile_number) 
WHERE tenant_id IS NULL AND mobile_number IS NOT NULL;

-- Update RLS policies to work with optional tenant_id
DROP POLICY IF EXISTS "Farmers can view own data via JWT" ON public.farmers;
DROP POLICY IF EXISTS "Farmers can update own data via JWT" ON public.farmers;

-- Create new RLS policies that work with or without tenant_id
CREATE POLICY "Farmers can view own data via JWT" 
ON public.farmers FOR SELECT 
USING (id::text = current_setting('request.jwt.claims', true)::json->>'farmer_id');

CREATE POLICY "Farmers can update own data via JWT" 
ON public.farmers FOR UPDATE 
USING (id::text = current_setting('request.jwt.claims', true)::json->>'farmer_id');

-- Update the PIN hash constraint to allow registration without tenant_id
DROP CONSTRAINT IF EXISTS farmers_pin_hash_check;
ADD CONSTRAINT farmers_pin_hash_check 
CHECK (mobile_number IS NULL OR pin_hash IS NOT NULL);
