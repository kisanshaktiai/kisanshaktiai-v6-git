
-- Add versioning columns to tenants table
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS branding_version integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS branding_updated_at timestamp with time zone DEFAULT now();

-- Add version column to tenant_branding table  
ALTER TABLE public.tenant_branding
ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;

-- Add version column to domain_mappings table
ALTER TABLE public.domain_mappings
ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;

-- Create function to update tenant branding version
CREATE OR REPLACE FUNCTION public.update_tenant_branding_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the tenant's branding version and timestamp
  UPDATE public.tenants 
  SET 
    branding_version = branding_version + 1,
    branding_updated_at = now()
  WHERE id = COALESCE(NEW.tenant_id, OLD.tenant_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for tenant_branding table updates
DROP TRIGGER IF EXISTS trigger_update_tenant_branding_version ON public.tenant_branding;
CREATE TRIGGER trigger_update_tenant_branding_version
  AFTER INSERT OR UPDATE OR DELETE ON public.tenant_branding
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tenant_branding_version();

-- Create trigger for domain_mappings table updates  
DROP TRIGGER IF EXISTS trigger_update_tenant_branding_version_domain ON public.domain_mappings;
CREATE TRIGGER trigger_update_tenant_branding_version_domain
  AFTER INSERT OR UPDATE OR DELETE ON public.domain_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tenant_branding_version();

-- Create trigger to increment tenant_branding version on updates
CREATE OR REPLACE FUNCTION public.increment_branding_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = COALESCE(OLD.version, 0) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for tenant_branding version increment
DROP TRIGGER IF EXISTS trigger_increment_branding_version ON public.tenant_branding;
CREATE TRIGGER trigger_increment_branding_version
  BEFORE UPDATE ON public.tenant_branding
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_branding_version();

-- Add trigger for domain_mappings version increment  
DROP TRIGGER IF EXISTS trigger_increment_domain_version ON public.domain_mappings;
CREATE TRIGGER trigger_increment_domain_version
  BEFORE UPDATE ON public.domain_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_branding_version();

-- Initialize existing records with version 1
UPDATE public.tenants 
SET branding_version = 1, branding_updated_at = now() 
WHERE branding_version IS NULL;

UPDATE public.tenant_branding 
SET version = 1 
WHERE version IS NULL;

UPDATE public.domain_mappings 
SET version = 1 
WHERE version IS NULL;
