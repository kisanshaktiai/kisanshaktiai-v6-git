
-- Phase 1: Fix Database Schema Issues
-- Remove the problematic foreign key constraint from user_profiles that references auth.users
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

-- Make user_profiles.id independent (it will still match farmers.id but without foreign key constraint)
-- This allows us to create user_profiles records without requiring auth.users records

-- Ensure farmers table has proper constraints
ALTER TABLE public.farmers 
  ALTER COLUMN mobile_number SET NOT NULL,
  ALTER COLUMN tenant_id SET NOT NULL;

-- Add unique constraint on mobile_number + tenant_id combination if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'farmers_mobile_tenant_unique'
  ) THEN
    CREATE UNIQUE INDEX farmers_mobile_tenant_unique 
    ON public.farmers (mobile_number, tenant_id);
  END IF;
END $$;

-- Ensure user_profiles has proper structure for our custom auth
ALTER TABLE public.user_profiles 
  ALTER COLUMN mobile_number SET NOT NULL,
  ADD COLUMN IF NOT EXISTS farmer_id UUID,
  ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_farmer_id ON public.user_profiles(farmer_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_mobile ON public.user_profiles(mobile_number);
