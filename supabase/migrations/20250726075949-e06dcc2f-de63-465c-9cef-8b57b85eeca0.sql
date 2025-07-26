
-- Fix the handle_new_user() trigger function to use mobile_number instead of phone
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id, 
    full_name, 
    email,
    mobile_number,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'mobile_number', NEW.phone),
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Failed to create user profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Add index on mobile_number for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_mobile_number ON public.user_profiles(mobile_number);

-- Add constraint to ensure mobile_number format is valid (optional but recommended)
ALTER TABLE public.user_profiles 
DROP CONSTRAINT IF EXISTS check_mobile_number_format;

ALTER TABLE public.user_profiles 
ADD CONSTRAINT check_mobile_number_format 
CHECK (mobile_number IS NULL OR mobile_number ~ '^[0-9]{10}$');
