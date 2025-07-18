-- Make all farmer table fields optional except required ones for PIN authentication
-- This allows gradual profile completion while maintaining authentication functionality

-- Update farmers table to make fields optional (except core auth fields)
ALTER TABLE public.farmers 
  ALTER COLUMN aadhaar_number DROP NOT NULL,
  ALTER COLUMN annual_income_range DROP NOT NULL,
  ALTER COLUMN farm_type DROP NOT NULL,
  ALTER COLUMN farming_experience_years DROP NOT NULL,
  ALTER COLUMN has_irrigation DROP NOT NULL,
  ALTER COLUMN has_loan DROP NOT NULL,
  ALTER COLUMN has_storage DROP NOT NULL,
  ALTER COLUMN has_tractor DROP NOT NULL,
  ALTER COLUMN irrigation_type DROP NOT NULL,
  ALTER COLUMN primary_crops DROP NOT NULL,
  ALTER COLUMN total_land_acres DROP NOT NULL,
  ALTER COLUMN preferred_dealer_id DROP NOT NULL,
  ALTER COLUMN shc_id DROP NOT NULL,
  ALTER COLUMN verification_documents DROP NOT NULL,
  ALTER COLUMN verified_by DROP NOT NULL,
  ALTER COLUMN verified_at DROP NOT NULL,
  ALTER COLUMN app_install_date DROP NOT NULL,
  ALTER COLUMN associated_tenants DROP NOT NULL;

-- Ensure core authentication fields remain required
-- These fields are essential for the PIN authentication system:
-- id (primary key), mobile_number, pin_hash, tenant_id, farmer_code
-- All other fields should be optional for gradual profile completion