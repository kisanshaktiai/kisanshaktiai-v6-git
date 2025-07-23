
-- First, let's standardize the field names by renaming 'phone' to 'mobile_number' in user_profiles table
ALTER TABLE user_profiles 
RENAME COLUMN phone TO mobile_number;

-- Update the user_profiles table structure to better align with farmers table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS tenant_id UUID,
ADD COLUMN IF NOT EXISTS is_profile_complete BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS village TEXT,
ADD COLUMN IF NOT EXISTS district TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS farming_experience_years INTEGER,
ADD COLUMN IF NOT EXISTS total_land_acres NUMERIC,
ADD COLUMN IF NOT EXISTS primary_crops TEXT[],
ADD COLUMN IF NOT EXISTS has_irrigation BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_tractor BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_storage BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS annual_income_range TEXT;

-- Create index on mobile_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_farmers_mobile_number ON farmers(mobile_number);
CREATE INDEX IF NOT EXISTS idx_user_profiles_mobile_number ON user_profiles(mobile_number);

-- Update RLS policies for user_profiles to work with farmers
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

-- Create new RLS policies for farmers accessing user_profiles
CREATE POLICY "Farmers can view their own profile" ON user_profiles
FOR SELECT USING (
  mobile_number IN (
    SELECT mobile_number FROM farmers 
    WHERE id::text = (current_setting('request.jwt.claims', true)::json->>'farmer_id')
  )
);

CREATE POLICY "Farmers can update their own profile" ON user_profiles
FOR UPDATE USING (
  mobile_number IN (
    SELECT mobile_number FROM farmers 
    WHERE id::text = (current_setting('request.jwt.claims', true)::json->>'farmer_id')
  )
);

CREATE POLICY "Farmers can insert their own profile" ON user_profiles
FOR INSERT WITH CHECK (
  mobile_number IN (
    SELECT mobile_number FROM farmers 
    WHERE id::text = (current_setting('request.jwt.claims', true)::json->>'farmer_id')
  )
);
