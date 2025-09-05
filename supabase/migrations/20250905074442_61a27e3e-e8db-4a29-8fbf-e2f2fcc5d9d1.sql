-- Fix the mobile auth issues with corrected syntax

-- Create the check_mobile_number_exists function with corrected syntax
CREATE OR REPLACE FUNCTION public.check_mobile_number_exists(mobile_num text)
RETURNS TABLE(user_exists boolean, profile jsonb)
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
      true AS user_exists,
      jsonb_build_object(
        'id', user_profile.id,
        'mobile_number', user_profile.mobile_number,
        'full_name', user_profile.full_name,
        'preferred_language', user_profile.preferred_language,
        'tenant_id', user_profile.tenant_id
      ) AS profile;
    RETURN;
  END IF;
  
  -- No user found
  RETURN QUERY SELECT 
    false AS user_exists,
    null::jsonb AS profile;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_mobile_number_exists(text) TO anon, authenticated, service_role;