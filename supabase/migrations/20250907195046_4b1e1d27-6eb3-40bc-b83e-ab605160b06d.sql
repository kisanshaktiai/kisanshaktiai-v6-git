-- Add pin column to farmers table if it doesn't exist
ALTER TABLE farmers 
ADD COLUMN IF NOT EXISTS pin VARCHAR(4);

-- Update any existing records that have pin_hash but no pin (optional migration)
-- This is just for testing, in production you'd handle this differently