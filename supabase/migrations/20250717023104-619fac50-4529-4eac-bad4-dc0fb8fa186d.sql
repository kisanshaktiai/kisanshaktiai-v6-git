-- Add missing fields to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS taluka varchar,
ADD COLUMN IF NOT EXISTS aadhaar_number varchar,
ADD COLUMN IF NOT EXISTS farmer_id varchar,
ADD COLUMN IF NOT EXISTS shc_id varchar;

-- Add missing fields to farmers table  
ALTER TABLE public.farmers
ADD COLUMN IF NOT EXISTS aadhaar_number varchar,
ADD COLUMN IF NOT EXISTS shc_id varchar;