-- Fix the mobile auth issues by creating the missing function and updating the trigger

-- Create the check_mobile_number_exists function
CREATE OR REPLACE FUNCTION public.check_mobile_number_exists(mobile_num text)
RETURNS TABLE(exists boolean, profile jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_profile RECORD;
BEGIN
  -- Check user_profiles table
  SELECT * INTO user_profile
  FROM public.user_profiles
  WHERE mobile_number = mobile_num
  LIMIT 1;
  
  IF FOUND THEN
    RETURN QUERY SELECT 
      true as exists,
      jsonb_build_object(
        'id', user_profile.id,
        'mobile_number', user_profile.mobile_number,
        'full_name', user_profile.full_name,
        'preferred_language', user_profile.preferred_language,
        'tenant_id', user_profile.tenant_id
      ) as profile;
    RETURN;
  END IF;
  
  -- No user found
  RETURN QUERY SELECT 
    false as exists,
    null::jsonb as profile;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_mobile_number_exists(text) TO anon, authenticated, service_role;

-- Fix the user_profiles trigger to handle mobile auth properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
  -- Insert user profile with proper data from auth metadata
  INSERT INTO public.user_profiles (
    id, 
    mobile_number,
    full_name,
    preferred_language,
    tenant_id,
    notification_preferences,
    created_at,
    updated_at
  ) VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'mobile_number', new.phone),
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(new.raw_user_meta_data->>'preferred_language', 'hi'),
    (new.raw_user_meta_data->>'tenant_id')::uuid,
    jsonb_build_object(
      'sms', true,
      'push', true,
      'email', false,
      'whatsapp', true,
      'calls', false
    ),
    now(),
    now()
  ) ON CONFLICT (id) DO UPDATE SET
    mobile_number = EXCLUDED.mobile_number,
    updated_at = now();
  
  RETURN new;
END;
$$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();