
-- Phase 1: Fix Database Structure & Triggers

-- 1. Create the missing check_mobile_number_exists function
CREATE OR REPLACE FUNCTION public.check_mobile_number_exists(mobile_num text)
RETURNS TABLE(exists boolean, profile jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Check user_profiles first
  RETURN QUERY
  SELECT 
    true as exists,
    jsonb_build_object(
      'id', up.id,
      'mobile_number', up.mobile_number,
      'full_name', up.full_name,
      'source', 'user_profile'
    ) as profile
  FROM public.user_profiles up
  WHERE up.mobile_number = mobile_num
  LIMIT 1;
  
  -- If not found in user_profiles, check farmers table
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      CASE WHEN f.id IS NOT NULL THEN true ELSE false END as exists,
      CASE 
        WHEN f.id IS NOT NULL THEN jsonb_build_object(
          'id', f.id,
          'mobile_number', f.mobile_number,
          'full_name', null,
          'source', 'farmer'
        )
        ELSE null
      END as profile
    FROM public.farmers f
    WHERE f.mobile_number = mobile_num
    LIMIT 1;
  END IF;
  
  -- If still not found, return false
  IF NOT FOUND THEN
    RETURN QUERY SELECT false as exists, null::jsonb as profile;
  END IF;
END;
$$;

-- 2. Create or update the handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Insert into user_profiles with error handling
  BEGIN
    INSERT INTO public.user_profiles (
      id, 
      full_name, 
      mobile_number,
      preferred_language,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
      COALESCE(NEW.raw_user_meta_data->>'mobile_number', NEW.phone),
      COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'hi'),
      NOW(),
      NOW()
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't block user creation
      RAISE WARNING 'Failed to create user profile for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;

-- 3. Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Simplify RLS policies to prevent conflicts
-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Farmers can update own data via JWT" ON public.farmers;
DROP POLICY IF EXISTS "Allow farmer registration" ON public.farmers;

-- Create simplified RLS policies for farmers table
CREATE POLICY "Farmers can manage their own data" 
  ON public.farmers 
  FOR ALL 
  USING (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create simplified policy for user_profiles if it doesn't exist
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.user_profiles;
CREATE POLICY "Users can manage their own profile" 
  ON public.user_profiles 
  FOR ALL 
  USING (auth.uid() = id);

-- 5. Add index for better performance on mobile number lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_mobile_number ON public.user_profiles(mobile_number);
CREATE INDEX IF NOT EXISTS idx_farmers_mobile_number ON public.farmers(mobile_number);
