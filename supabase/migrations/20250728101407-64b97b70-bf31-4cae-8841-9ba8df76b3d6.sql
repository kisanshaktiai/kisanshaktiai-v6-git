-- Fix tenant association: Add default tenant for existing users and ensure proper user_tenants relationship
-- Insert default tenant association for authenticated users who don't have one

INSERT INTO public.user_tenants (user_id, tenant_id, role, is_active)
SELECT 
  auth.uid(), 
  'default'::uuid, 
  'farmer'::user_role, 
  true
WHERE auth.uid() IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM public.user_tenants 
    WHERE user_id = auth.uid()
  );

-- Add indexes to improve land query performance
CREATE INDEX IF NOT EXISTS idx_lands_farmer_created 
ON public.lands (farmer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_soil_health_land_date 
ON public.soil_health (land_id, test_date DESC);

CREATE INDEX IF NOT EXISTS idx_crop_history_land_status 
ON public.crop_history (land_id, status);

CREATE INDEX IF NOT EXISTS idx_ndvi_data_land_date 
ON public.ndvi_data (land_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_land_activities_land_date 
ON public.land_activities (land_id, activity_date DESC);

-- Add function to get current tenant ID for better performance
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT tenant_id FROM public.user_tenants 
     WHERE user_id = auth.uid() AND is_active = true 
     LIMIT 1),
    'default'::uuid
  );
$$;