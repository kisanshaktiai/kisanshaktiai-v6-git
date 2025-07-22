
-- Create a simple function to get default tenant without complex type inference
CREATE OR REPLACE FUNCTION get_default_tenant_simple()
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  type text,
  status text,
  subscription_plan text
) 
LANGUAGE sql
STABLE
AS $$
  SELECT 
    t.id,
    t.name,
    t.slug,
    t.type::text,
    t.status::text,
    t.subscription_plan::text
  FROM tenants t
  WHERE t.is_default = true 
  AND t.status = 'active'
  LIMIT 1;
$$;
