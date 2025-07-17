-- ==========================================
-- COMPREHENSIVE TENANT-READINESS AND SECURITY FIXES
-- ==========================================

-- 1. Fix foreign key constraint to allow user deletion
ALTER TABLE public.user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Add tenant_id to farmers table for direct tenant association
ALTER TABLE public.farmers 
ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- 3. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_farmers_tenant_id ON public.farmers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_farmers_id ON public.farmers(id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON public.user_profiles(id);

-- 4. Enable RLS on tables that are missing it
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_branding ENABLE ROW LEVEL SECURITY;

-- 5. Create security definer functions to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID AS $$
DECLARE
  tenant_id UUID;
BEGIN
  -- Get tenant_id from user_tenants table for current user
  SELECT ut.tenant_id INTO tenant_id
  FROM public.user_tenants ut
  WHERE ut.user_id = auth.uid() 
    AND ut.is_active = true
  ORDER BY ut.is_primary DESC, ut.created_at ASC
  LIMIT 1;
  
  RETURN tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

CREATE OR REPLACE FUNCTION public.is_tenant_admin(_tenant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN := false;
BEGIN
  -- Check if user is admin or owner of the tenant
  SELECT EXISTS(
    SELECT 1 
    FROM public.user_tenants ut
    WHERE ut.user_id = auth.uid() 
      AND ut.tenant_id = _tenant_id
      AND ut.role IN ('admin', 'owner')
      AND ut.is_active = true
  ) INTO is_admin;
  
  RETURN is_admin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- 6. Update calculate_land_health_score function with proper search_path
CREATE OR REPLACE FUNCTION public.calculate_land_health_score(land_uuid UUID)
RETURNS NUMERIC AS $$
DECLARE
  soil_score DECIMAL(3,1) := 0;
  ndvi_score DECIMAL(3,1) := 0;
  final_score DECIMAL(3,1);
BEGIN
  -- Calculate soil health score (0-5)
  SELECT 
    CASE 
      WHEN ph_level BETWEEN 6.0 AND 7.5 THEN 2.0
      WHEN ph_level BETWEEN 5.5 AND 8.0 THEN 1.5
      ELSE 0.5
    END +
    CASE 
      WHEN organic_carbon > 1.0 THEN 1.5
      WHEN organic_carbon > 0.5 THEN 1.0
      ELSE 0.5
    END +
    CASE 
      WHEN nitrogen_level = 'high' THEN 1.5
      WHEN nitrogen_level = 'medium' THEN 1.0
      ELSE 0.5
    END
  INTO soil_score
  FROM public.soil_health 
  WHERE land_id = land_uuid 
  ORDER BY created_at DESC 
  LIMIT 1;

  -- Calculate NDVI score (0-5)
  SELECT 
    CASE 
      WHEN AVG(ndvi_value) > 0.7 THEN 5.0
      WHEN AVG(ndvi_value) > 0.5 THEN 4.0
      WHEN AVG(ndvi_value) > 0.3 THEN 3.0
      WHEN AVG(ndvi_value) > 0.1 THEN 2.0
      ELSE 1.0
    END
  INTO ndvi_score
  FROM public.ndvi_data 
  WHERE land_id = land_uuid 
    AND date >= CURRENT_DATE - INTERVAL '30 days';

  -- Combine scores (weighted average)
  final_score := COALESCE(soil_score, 2.5) * 0.6 + COALESCE(ndvi_score, 2.5) * 0.4;
  
  RETURN LEAST(5.0, GREATEST(1.0, final_score));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. Create comprehensive RLS policies for tenant isolation

-- Tenants policies
DROP POLICY IF EXISTS "Users can access their tenant data" ON public.tenants;
CREATE POLICY "Users can access their tenant data" ON public.tenants
FOR ALL USING (
  id IN (
    SELECT tenant_id 
    FROM public.user_tenants 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Tenant features policies
DROP POLICY IF EXISTS "Users can access their tenant features" ON public.tenant_features;
CREATE POLICY "Users can access their tenant features" ON public.tenant_features
FOR ALL USING (
  tenant_id IN (
    SELECT tenant_id 
    FROM public.user_tenants 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Tenant branding policies
DROP POLICY IF EXISTS "Users can access their tenant branding" ON public.tenant_branding;
CREATE POLICY "Users can access their tenant branding" ON public.tenant_branding
FOR ALL USING (
  tenant_id IN (
    SELECT tenant_id 
    FROM public.user_tenants 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Update farmers policies for tenant-based access
DROP POLICY IF EXISTS "Farmers can view their own data" ON public.farmers;
DROP POLICY IF EXISTS "Farmers can update their own data" ON public.farmers;
DROP POLICY IF EXISTS "Users can create their own farmer profile" ON public.farmers;

CREATE POLICY "Farmers can view their own data" ON public.farmers
FOR SELECT USING (
  auth.uid() = id OR 
  tenant_id IN (
    SELECT tenant_id 
    FROM public.user_tenants 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Farmers can update their own data" ON public.farmers
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can create farmer profiles in their tenant" ON public.farmers
FOR INSERT WITH CHECK (
  auth.uid() = id AND
  tenant_id IN (
    SELECT tenant_id 
    FROM public.user_tenants 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Update lands policies for better tenant isolation
DROP POLICY IF EXISTS "Users can view their own lands" ON public.lands;
DROP POLICY IF EXISTS "Users can update their own lands" ON public.lands;
DROP POLICY IF EXISTS "Users can delete their own lands" ON public.lands;
DROP POLICY IF EXISTS "Users can create their own lands" ON public.lands;

CREATE POLICY "Users can view their own lands" ON public.lands
FOR SELECT USING (
  auth.uid() = farmer_id AND
  tenant_id IN (
    SELECT tenant_id 
    FROM public.user_tenants 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Users can update their own lands" ON public.lands
FOR UPDATE USING (
  auth.uid() = farmer_id AND
  tenant_id IN (
    SELECT tenant_id 
    FROM public.user_tenants 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Users can delete their own lands" ON public.lands
FOR DELETE USING (
  auth.uid() = farmer_id AND
  tenant_id IN (
    SELECT tenant_id 
    FROM public.user_tenants 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Users can create lands in their tenant" ON public.lands
FOR INSERT WITH CHECK (
  auth.uid() = farmer_id AND
  tenant_id IN (
    SELECT tenant_id 
    FROM public.user_tenants 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- 8. Create user_tenants policies
CREATE POLICY "Users can view their tenant associations" ON public.user_tenants
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Tenant admins can manage user associations" ON public.user_tenants
FOR ALL USING (
  public.is_tenant_admin(tenant_id) OR auth.uid() = user_id
);

-- 9. Update session cleanup function with proper search_path
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.user_sessions 
  WHERE expires_at < NOW() OR is_active = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 10. Clean up problematic auth records (users without profiles causing FK violations)
-- First, let's identify and clean orphaned sessions
DELETE FROM public.user_sessions 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Delete auth users that have no associated profiles and are causing issues
-- Note: This should be done carefully in production
DO $$
BEGIN
  -- Delete users that exist in auth but have no profiles and are not in user_tenants
  DELETE FROM auth.users 
  WHERE id NOT IN (SELECT id FROM public.user_profiles)
    AND id NOT IN (SELECT user_id FROM public.user_tenants WHERE user_id IS NOT NULL);
END $$;

-- 11. Create trigger to automatically set tenant_id on farmer creation
CREATE OR REPLACE FUNCTION public.set_farmer_tenant_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Set tenant_id to the user's primary tenant if not already set
  IF NEW.tenant_id IS NULL THEN
    SELECT tenant_id INTO NEW.tenant_id
    FROM public.user_tenants 
    WHERE user_id = NEW.id 
      AND is_active = true
    ORDER BY is_primary DESC, created_at ASC
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS set_farmer_tenant_id_trigger ON public.farmers;
CREATE TRIGGER set_farmer_tenant_id_trigger
  BEFORE INSERT OR UPDATE ON public.farmers
  FOR EACH ROW EXECUTE FUNCTION public.set_farmer_tenant_id();

-- 12. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;