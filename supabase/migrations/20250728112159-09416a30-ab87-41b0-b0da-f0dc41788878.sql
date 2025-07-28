-- Create activation codes table for tenant activation system
CREATE TABLE IF NOT EXISTS public.activation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) NOT NULL UNIQUE,
  tenant_id UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,
  max_uses INTEGER DEFAULT NULL,
  used_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_by UUID DEFAULT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create activation logs table for tracking usage
CREATE TABLE IF NOT EXISTS public.activation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activation_code_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_activation_codes_code ON public.activation_codes(code);
CREATE INDEX IF NOT EXISTS idx_activation_codes_tenant ON public.activation_codes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activation_codes_active ON public.activation_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_activation_logs_code ON public.activation_logs(activation_code_id);
CREATE INDEX IF NOT EXISTS idx_activation_logs_tenant ON public.activation_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activation_logs_created ON public.activation_logs(created_at);

-- Add foreign key constraints
ALTER TABLE public.activation_codes 
ADD CONSTRAINT fk_activation_codes_tenant 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.activation_logs
ADD CONSTRAINT fk_activation_logs_activation_code
FOREIGN KEY (activation_code_id) REFERENCES public.activation_codes(id) ON DELETE CASCADE;

ALTER TABLE public.activation_logs
ADD CONSTRAINT fk_activation_logs_tenant
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activation_codes
CREATE POLICY "Public can validate activation codes" 
ON public.activation_codes FOR SELECT 
USING (is_active = true);

CREATE POLICY "Tenant admins can manage activation codes" 
ON public.activation_codes FOR ALL 
USING (tenant_id IN (
  SELECT user_tenants.tenant_id 
  FROM user_tenants 
  WHERE user_tenants.user_id = auth.uid() 
  AND user_tenants.is_active = true 
  AND user_tenants.role IN ('tenant_owner', 'tenant_admin')
));

-- RLS Policies for activation_logs
CREATE POLICY "System can insert activation logs" 
ON public.activation_logs FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Tenant admins can view activation logs" 
ON public.activation_logs FOR SELECT 
USING (tenant_id IN (
  SELECT user_tenants.tenant_id 
  FROM user_tenants 
  WHERE user_tenants.user_id = auth.uid() 
  AND user_tenants.is_active = true 
  AND user_tenants.role IN ('tenant_owner', 'tenant_admin')
));

-- Super admin policies
CREATE POLICY "Super admins can manage all activation codes" 
ON public.activation_codes FOR ALL 
USING (is_authenticated_admin());

CREATE POLICY "Super admins can view all activation logs" 
ON public.activation_logs FOR ALL 
USING (is_authenticated_admin());

-- Insert sample activation codes for testing
INSERT INTO public.activation_codes (code, tenant_id, max_uses) 
SELECT 'DEMO-2025-KISAN-AI', id, 100 
FROM public.tenants 
WHERE slug = 'default' 
ON CONFLICT (code) DO NOTHING;

-- Add performance optimization indexes on core tables for multi-tenant queries
CREATE INDEX IF NOT EXISTS idx_tenant_features_composite 
ON public.tenant_features (tenant_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_tenant_branding_composite 
ON public.tenant_branding (tenant_id, version DESC);

CREATE INDEX IF NOT EXISTS idx_farmers_tenant_phone 
ON public.farmers (tenant_id, mobile_number);

CREATE INDEX IF NOT EXISTS idx_lands_tenant_farmer 
ON public.lands (tenant_id, farmer_id, created_at DESC);

-- Optimize user_tenants queries
CREATE INDEX IF NOT EXISTS idx_user_tenants_active_role 
ON public.user_tenants (user_id, is_active, role);

-- Add composite indexes for common dashboard queries
CREATE INDEX IF NOT EXISTS idx_crop_history_tenant_date 
ON public.crop_history (tenant_id, planting_date DESC);

CREATE INDEX IF NOT EXISTS idx_weather_current_tenant_location 
ON public.weather_current (tenant_id, latitude, longitude, created_at DESC);