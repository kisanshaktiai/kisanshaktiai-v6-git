
-- Fix the farmers table to auto-generate UUIDs for the id field
ALTER TABLE public.farmers 
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Also ensure the farmer_code has a more robust generation in case of conflicts
-- Add a unique constraint on farmer_code to prevent duplicates
ALTER TABLE public.farmers 
  ADD CONSTRAINT farmers_farmer_code_unique UNIQUE (farmer_code);

-- Update the mobile number constraint to be more explicit
-- Drop existing constraints first
DROP INDEX IF EXISTS farmers_mobile_unique_no_tenant;
DROP INDEX IF EXISTS farmers_tenant_mobile_unique;

-- Create a single unique constraint that handles both cases properly
CREATE UNIQUE INDEX farmers_mobile_tenant_unique 
ON public.farmers (mobile_number, COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid));
