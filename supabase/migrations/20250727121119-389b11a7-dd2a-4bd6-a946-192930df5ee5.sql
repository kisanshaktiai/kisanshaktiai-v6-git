
-- Create analytics events table for tenant fallback tracking
CREATE TABLE IF NOT EXISTS public.tenant_detection_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL, -- 'fallback', 'error', 'emergency', 'success'
  domain text NOT NULL,
  tenant_id uuid,
  fallback_reason text,
  detection_method text,
  user_agent text,
  ip_address inet,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}',
  error_details jsonb DEFAULT '{}',
  session_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_tenant_detection_events_timestamp ON public.tenant_detection_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_tenant_detection_events_domain ON public.tenant_detection_events(domain);
CREATE INDEX IF NOT EXISTS idx_tenant_detection_events_type ON public.tenant_detection_events(event_type);

-- Enable RLS
ALTER TABLE public.tenant_detection_events ENABLE ROW LEVEL SECURITY;

-- Create policy for super admins to access all events
CREATE POLICY "Super admins can access all tenant detection events"
  ON public.tenant_detection_events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE id = auth.uid() 
      AND is_active = true 
      AND role IN ('super_admin', 'platform_admin')
    )
  );

-- Create policy for tenant admins to access their tenant events
CREATE POLICY "Tenant admins can access their tenant detection events"
  ON public.tenant_detection_events
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT user_tenants.tenant_id
      FROM user_tenants
      WHERE user_tenants.user_id = auth.uid()
      AND user_tenants.is_active = true
      AND user_tenants.role IN ('tenant_admin', 'tenant_owner')
    )
  );

-- Function to log tenant detection events
CREATE OR REPLACE FUNCTION public.log_tenant_detection_event(
  p_event_type text,
  p_domain text,
  p_tenant_id uuid DEFAULT NULL,
  p_fallback_reason text DEFAULT NULL,
  p_detection_method text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}',
  p_error_details jsonb DEFAULT '{}',
  p_session_id text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_id uuid;
BEGIN
  INSERT INTO public.tenant_detection_events (
    event_type,
    domain,
    tenant_id,
    fallback_reason,
    detection_method,
    user_agent,
    ip_address,
    metadata,
    error_details,
    session_id
  ) VALUES (
    p_event_type,
    p_domain,
    p_tenant_id,
    p_fallback_reason,
    p_detection_method,
    p_user_agent,
    p_ip_address,
    COALESCE(p_metadata, '{}'),
    COALESCE(p_error_details, '{}'),
    p_session_id
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$;
