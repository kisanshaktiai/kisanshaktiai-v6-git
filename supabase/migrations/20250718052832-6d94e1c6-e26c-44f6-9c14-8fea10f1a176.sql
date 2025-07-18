
-- Add authentication fields to farmers table
ALTER TABLE public.farmers 
ADD COLUMN mobile_number VARCHAR(15),
ADD COLUMN pin_hash VARCHAR(255),
ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN login_attempts INTEGER DEFAULT 0;

-- Create unique composite index for tenant isolation
CREATE UNIQUE INDEX farmers_tenant_mobile_unique 
ON public.farmers (tenant_id, mobile_number) 
WHERE mobile_number IS NOT NULL;

-- Add constraints for mobile number validation
ALTER TABLE public.farmers 
ADD CONSTRAINT farmers_mobile_number_check 
CHECK (mobile_number ~ '^[0-9]{10}$');

-- Add constraint for PIN hash (should not be null if mobile_number is set)
ALTER TABLE public.farmers 
ADD CONSTRAINT farmers_pin_hash_check 
CHECK ((mobile_number IS NULL AND pin_hash IS NULL) OR (mobile_number IS NOT NULL AND pin_hash IS NOT NULL));

-- Update RLS policies to work with direct farmer access
DROP POLICY IF EXISTS "Farmers can view their own data" ON public.farmers;
DROP POLICY IF EXISTS "Farmers can update their own data" ON public.farmers;
DROP POLICY IF EXISTS "Users can create farmer profiles in their tenant" ON public.farmers;

-- Create new RLS policies for JWT-based authentication
CREATE POLICY "Farmers can view own data via JWT" 
ON public.farmers FOR SELECT 
USING (id::text = current_setting('request.jwt.claims', true)::json->>'farmer_id');

CREATE POLICY "Farmers can update own data via JWT" 
ON public.farmers FOR UPDATE 
USING (id::text = current_setting('request.jwt.claims', true)::json->>'farmer_id');

CREATE POLICY "Allow farmer registration" 
ON public.farmers FOR INSERT 
WITH CHECK (true);

-- Add function to validate JWT farmer access
CREATE OR REPLACE FUNCTION public.get_jwt_farmer_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'farmer_id')::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid
  );
$$;
