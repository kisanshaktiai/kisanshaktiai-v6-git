-- Create user_sessions table for better session tracking
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id VARCHAR(64) NOT NULL,
  access_token_hash VARCHAR(64),
  refresh_token_hash VARCHAR(64),
  device_info JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON public.user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own sessions" 
ON public.user_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions" 
ON public.user_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" 
ON public.user_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to cleanup expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_sessions 
  SET is_active = false 
  WHERE expires_at < now() AND is_active = true;
END;
$$;

-- Create trigger to update last_activity_at
CREATE OR REPLACE FUNCTION public.update_session_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.last_activity_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_sessions_activity
  BEFORE UPDATE ON public.user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_session_activity();