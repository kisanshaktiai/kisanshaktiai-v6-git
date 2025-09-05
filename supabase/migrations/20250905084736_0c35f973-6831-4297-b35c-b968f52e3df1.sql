-- Add PIN-based authentication columns to farmers table
ALTER TABLE farmers
ADD COLUMN IF NOT EXISTS pin_hash TEXT,
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_failed_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS pin_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_farmers_mobile_active ON farmers(mobile_number, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_farmers_tenant_mobile ON farmers(tenant_id, mobile_number);

-- Create RPC function to check mobile number exists across tables
CREATE OR REPLACE FUNCTION check_mobile_number_exists(mobile_num TEXT)
RETURNS TABLE(
  user_exists BOOLEAN,
  profile JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile RECORD;
  v_exists BOOLEAN := false;
BEGIN
  -- Check in user_profiles first
  SELECT * INTO v_profile
  FROM user_profiles
  WHERE mobile_number = mobile_num
  LIMIT 1;
  
  IF FOUND THEN
    RETURN QUERY SELECT 
      true as user_exists,
      jsonb_build_object(
        'id', v_profile.id,
        'mobile_number', v_profile.mobile_number,
        'full_name', v_profile.full_name,
        'source', 'user_profiles'
      ) as profile;
    RETURN;
  END IF;
  
  -- Check in farmers table
  SELECT * INTO v_profile
  FROM farmers
  WHERE mobile_number = mobile_num
  LIMIT 1;
  
  IF FOUND THEN
    RETURN QUERY SELECT 
      true as user_exists,
      jsonb_build_object(
        'id', v_profile.id,
        'mobile_number', v_profile.mobile_number,
        'full_name', v_profile.full_name,
        'tenant_id', v_profile.tenant_id,
        'source', 'farmers'
      ) as profile;
    RETURN;
  END IF;
  
  -- No user found
  RETURN QUERY SELECT 
    false as user_exists,
    null::jsonb as profile;
END;
$$;

-- Create function to validate farmer PIN (for secure server-side validation)
CREATE OR REPLACE FUNCTION validate_farmer_pin(
  p_mobile_number TEXT,
  p_pin_hash TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_farmer_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 
    FROM farmers 
    WHERE mobile_number = p_mobile_number 
      AND pin_hash = p_pin_hash
      AND is_active = true
  ) INTO v_farmer_exists;
  
  RETURN v_farmer_exists;
END;
$$;

-- Update RLS policies for farmers table to include tenant isolation
DROP POLICY IF EXISTS "Farmers can view their own data" ON farmers;
DROP POLICY IF EXISTS "Farmers can update their own data" ON farmers;
DROP POLICY IF EXISTS "Tenant admins can manage farmers" ON farmers;

-- Farmers can only view their own data
CREATE POLICY "Farmers can view their own data"
ON farmers FOR SELECT
USING (auth.uid() = id);

-- Farmers can update their own non-sensitive data
CREATE POLICY "Farmers can update their own data"
ON farmers FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND pin_hash = (SELECT pin_hash FROM farmers WHERE id = auth.uid()) -- Prevent PIN hash modification through direct update
);

-- Tenant admins can view farmers in their tenant
CREATE POLICY "Tenant admins can view tenant farmers"
ON farmers FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id 
    FROM user_tenants 
    WHERE user_id = auth.uid() 
      AND role IN ('tenant_admin', 'tenant_owner')
      AND is_active = true
  )
);

-- System can insert farmers (for registration)
CREATE POLICY "System can insert farmers"
ON farmers FOR INSERT
WITH CHECK (true);

-- Add trigger to automatically update user_profiles when farmer is created
CREATE OR REPLACE FUNCTION sync_farmer_to_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update user_profiles when farmer is created/updated
  INSERT INTO user_profiles (
    id,
    mobile_number,
    full_name,
    preferred_language,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.mobile_number,
    NEW.full_name,
    NEW.preferred_language,
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) DO UPDATE SET
    mobile_number = EXCLUDED.mobile_number,
    full_name = EXCLUDED.full_name,
    preferred_language = EXCLUDED.preferred_language,
    updated_at = EXCLUDED.updated_at;
  
  RETURN NEW;
END;
$$;

-- Create trigger for farmer to user_profiles sync
DROP TRIGGER IF EXISTS sync_farmer_profile ON farmers;
CREATE TRIGGER sync_farmer_profile
AFTER INSERT OR UPDATE ON farmers
FOR EACH ROW
EXECUTE FUNCTION sync_farmer_to_user_profile();