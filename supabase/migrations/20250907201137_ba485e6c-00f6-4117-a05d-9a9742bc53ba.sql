-- Update the existing farmer record with a test PIN for development
UPDATE farmers 
SET pin = '1234',
    updated_at = now()
WHERE mobile_number = '9860989495' AND pin IS NULL;

-- Add a check constraint to ensure PIN is always 4 digits (optional but recommended)
ALTER TABLE farmers 
ADD CONSTRAINT check_pin_format 
CHECK (pin ~ '^\d{4}$' OR pin IS NULL);