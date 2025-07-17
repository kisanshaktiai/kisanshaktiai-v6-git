-- Create user sessions table for better session tracking
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  session_id text NOT NULL UNIQUE,
  access_token_hash text,
  refresh_token_hash text,
  expires_at timestamp with time zone NOT NULL,
  device_info jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean DEFAULT true,
  last_activity_at timestamp with time zone DEFAULT now()
);

-- Add RLS policies for user sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions" 
ON public.user_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own sessions" 
ON public.user_sessions 
FOR ALL 
USING (auth.uid() = user_id);

-- Create session cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.user_sessions 
  WHERE expires_at < now() - interval '1 day';
END;
$$;

-- Create trigger for automatic session updates
CREATE OR REPLACE FUNCTION public.update_session_activity()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  NEW.last_activity_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_session_activity_trigger
  BEFORE UPDATE ON public.user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_session_activity();