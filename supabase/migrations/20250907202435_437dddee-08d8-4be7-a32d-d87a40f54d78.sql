-- Drop the trigger and function with CASCADE
DROP FUNCTION IF EXISTS sync_farmer_to_user_profile() CASCADE;

-- Update the existing farmer record with a test PIN
UPDATE farmers 
SET pin = '1234',
    updated_at = now()
WHERE mobile_number = '9860989495' AND pin IS NULL;

-- Add a check constraint to ensure PIN is always 4 digits (if not already exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_pin_format'
    ) THEN
        ALTER TABLE farmers 
        ADD CONSTRAINT check_pin_format 
        CHECK (pin ~ '^\d{4}$' OR pin IS NULL);
    END IF;
END $$;