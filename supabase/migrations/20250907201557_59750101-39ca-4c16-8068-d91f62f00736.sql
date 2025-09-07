-- First, drop the problematic trigger
DROP TRIGGER IF EXISTS sync_farmer_to_user_profile_trigger ON farmers;
DROP FUNCTION IF EXISTS sync_farmer_to_user_profile();

-- Now update the existing farmer record with a test PIN
UPDATE farmers 
SET pin = '1234',
    updated_at = now()
WHERE mobile_number = '9860989495' AND pin IS NULL;

-- Add a check constraint to ensure PIN is always 4 digits
ALTER TABLE farmers 
ADD CONSTRAINT check_pin_format 
CHECK (pin ~ '^\d{4}$' OR pin IS NULL);