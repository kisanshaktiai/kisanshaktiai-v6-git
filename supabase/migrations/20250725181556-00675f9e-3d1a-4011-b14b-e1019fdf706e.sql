
-- Create optimized tenant detection function with proper security and performance
CREATE OR REPLACE FUNCTION public.get_tenant_by_domain(p_domain text)
RETURNS TABLE (
  tenant_id uuid,
  tenant_name text,
  tenant_slug text,
  tenant_type text,
  logo_url text,
  app_name text,
  app_tagline text,
  primary_color text,
  secondary_color text,
  background_color text
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- First try domain mapping
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.slug,
    t.type,
    tb.logo_url,
    tb.app_name,
    tb.app_tagline,
    tb.primary_color,
    tb.secondary_color,
    tb.background_color
  FROM tenants t
  LEFT JOIN tenant_branding tb ON t.id = tb.tenant_id
  INNER JOIN domain_mappings dm ON t.id = dm.tenant_id
  WHERE dm.domain = p_domain 
    AND dm.is_active = true 
    AND t.status = 'active'
  LIMIT 1;
  
  -- If no domain mapping, try subdomain
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      t.id,
      t.name,
      t.slug,
      t.type,
      tb.logo_url,
      tb.app_name,
      tb.app_tagline,
      tb.primary_color,
      tb.secondary_color,
      tb.background_color
    FROM tenants t
    LEFT JOIN tenant_branding tb ON t.id = tb.tenant_id
    WHERE t.subdomain = split_part(p_domain, '.', 1)
      AND t.status = 'active'
    LIMIT 1;
  END IF;
END;
$$;

-- Create function to get default tenant efficiently
CREATE OR REPLACE FUNCTION public.get_default_tenant()
RETURNS TABLE (
  tenant_id uuid,
  tenant_name text,
  tenant_slug text,
  tenant_type text,
  logo_url text,
  app_name text,
  app_tagline text,
  primary_color text,
  secondary_color text,
  background_color text
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.slug,
    t.type,
    tb.logo_url,
    tb.app_name,
    tb.app_tagline,
    tb.primary_color,
    tb.secondary_color,
    tb.background_color
  FROM tenants t
  LEFT JOIN tenant_branding tb ON t.id = tb.tenant_id
  WHERE t.is_default = true 
    AND t.status = 'active'
  LIMIT 1;
END;
$$;

-- Update RLS policies for public tenant access (required for multi-tenant SaaS)
DROP POLICY IF EXISTS "Allow public tenant read" ON public.tenants;
CREATE POLICY "Allow public tenant read" 
  ON public.tenants FOR SELECT 
  USING (status = 'active');

DROP POLICY IF EXISTS "Allow public tenant branding read" ON public.tenant_branding;
CREATE POLICY "Allow public tenant branding read" 
  ON public.tenant_branding FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Allow public domain mapping read" ON public.domain_mappings;
CREATE POLICY "Allow public domain mapping read" 
  ON public.domain_mappings FOR SELECT 
  USING (is_active = true);

-- Create performance indexes for tenant detection
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenants_status_default 
  ON public.tenants (status, is_default) 
  WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenants_subdomain_status 
  ON public.tenants (subdomain, status) 
  WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_domain_mappings_domain_active 
  ON public.domain_mappings (domain, is_active) 
  WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenant_branding_tenant_id 
  ON public.tenant_branding (tenant_id);

-- Create tenant cache table for performance
CREATE TABLE IF NOT EXISTS public.tenant_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text UNIQUE NOT NULL,
  tenant_data jsonb NOT NULL,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '1 hour'),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create index on cache table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenant_cache_key_expires 
  ON public.tenant_cache (cache_key, expires_at);

-- Enable RLS on cache table
ALTER TABLE public.tenant_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read on cache (for performance)
CREATE POLICY "Allow public tenant cache read" 
  ON public.tenant_cache FOR SELECT 
  USING (expires_at > now());

-- Create function to update cache
CREATE OR REPLACE FUNCTION public.update_tenant_cache(
  p_cache_key text,
  p_tenant_data jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO tenant_cache (cache_key, tenant_data, expires_at)
  VALUES (p_cache_key, p_tenant_data, now() + interval '1 hour')
  ON CONFLICT (cache_key) 
  DO UPDATE SET 
    tenant_data = EXCLUDED.tenant_data,
    expires_at = EXCLUDED.expires_at,
    updated_at = now();
END;
$$;

-- Create cleanup function for expired cache entries
CREATE OR REPLACE FUNCTION public.cleanup_tenant_cache()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM tenant_cache WHERE expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
