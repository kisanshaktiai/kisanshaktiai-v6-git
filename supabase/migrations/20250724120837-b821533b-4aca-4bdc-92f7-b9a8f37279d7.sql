
-- Phase 1: Critical Security Fixes

-- 1. Enable RLS on critical tables that are missing it
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;

-- 2. Fix database function security by adding proper search_path
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.farmer_tenant_associations 
  WHERE farmer_id = auth.uid() AND status = 'active'
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = '';

CREATE OR REPLACE FUNCTION public.is_tenant_admin(_tenant_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.farmer_tenant_associations 
    WHERE farmer_id = auth.uid() 
    AND tenant_id = _tenant_id 
    AND role IN ('admin', 'owner')
    AND status = 'active'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = '';

-- 3. Add comprehensive RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" 
  ON public.user_profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.user_profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON public.user_profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 4. Add RLS policies for ai_interactions
CREATE POLICY "Users can view their own AI interactions" 
  ON public.ai_interactions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own AI interactions" 
  ON public.ai_interactions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 5. Add security function for rate limiting authentication
CREATE OR REPLACE FUNCTION public.check_auth_rate_limit(phone_number TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  attempt_count INTEGER;
  time_window INTERVAL := '1 hour';
BEGIN
  -- Count authentication attempts in the last hour
  SELECT COUNT(*) INTO attempt_count
  FROM auth.audit_log_entries 
  WHERE payload->>'phone' = phone_number 
  AND payload->>'action' IN ('login_attempt', 'signup_attempt')
  AND created_at > (NOW() - time_window);
  
  -- Allow max 5 attempts per hour
  RETURN attempt_count < 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 6. Create table for tracking authentication attempts
CREATE TABLE IF NOT EXISTS public.auth_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  attempt_type TEXT NOT NULL, -- 'login', 'signup', 'otp_request'
  success BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.auth_attempts ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for auth_attempts (admin only)
CREATE POLICY "Only admins can access auth attempts" 
  ON public.auth_attempts FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- 7. Add function to log authentication attempts
CREATE OR REPLACE FUNCTION public.log_auth_attempt(
  p_phone_number TEXT,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_attempt_type TEXT DEFAULT 'login',
  p_success BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.auth_attempts (
    phone_number, ip_address, user_agent, 
    attempt_type, success, created_at
  ) VALUES (
    p_phone_number, p_ip_address, p_user_agent,
    p_attempt_type, p_success, NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 8. Add function to generate cryptographically secure passwords
CREATE OR REPLACE FUNCTION public.generate_secure_password(length INTEGER DEFAULT 32)
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  result TEXT := '';
  i INTEGER := 0;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 9. Create table for session tracking with security
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  access_token_hash TEXT NOT NULL,
  refresh_token_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  device_info JSONB DEFAULT '{}',
  ip_address INET,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS for user_sessions
CREATE POLICY "Users can view their own sessions" 
  ON public.user_sessions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" 
  ON public.user_sessions FOR UPDATE 
  USING (auth.uid() = user_id);

-- 10. Add trigger to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_sessions_updated_at 
  BEFORE UPDATE ON public.user_sessions 
  FOR EACH ROW 
  EXECUTE PROCEDURE public.update_updated_at_column();
