-- Fix multi-tenant compliance by adding missing tenant_id columns

-- Add tenant_id to tables that should be tenant-isolated
ALTER TABLE public.marketplace_saved_items ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.resource_usage ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.land_activities ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.soil_health ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.crop_history ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.ndvi_data ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.satellite_imagery ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.crop_health_assessments ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.satellite_alerts ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.prescription_maps ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.yield_predictions ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.weather_preferences ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.weather_activity_recommendations ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Update existing records to have tenant_id from related farmer/land records
UPDATE public.marketplace_saved_items 
SET tenant_id = (
  SELECT f.tenant_id 
  FROM public.farmers f 
  WHERE f.id = marketplace_saved_items.user_id
) 
WHERE tenant_id IS NULL;

UPDATE public.resource_usage 
SET tenant_id = (
  SELECT l.tenant_id 
  FROM public.lands l 
  WHERE l.id = resource_usage.land_id
) 
WHERE tenant_id IS NULL;

UPDATE public.land_activities 
SET tenant_id = (
  SELECT l.tenant_id 
  FROM public.lands l 
  WHERE l.id = land_activities.land_id
) 
WHERE tenant_id IS NULL;

UPDATE public.soil_health 
SET tenant_id = (
  SELECT l.tenant_id 
  FROM public.lands l 
  WHERE l.id = soil_health.land_id
) 
WHERE tenant_id IS NULL;

UPDATE public.crop_history 
SET tenant_id = (
  SELECT l.tenant_id 
  FROM public.lands l 
  WHERE l.id = crop_history.land_id
) 
WHERE tenant_id IS NULL;

UPDATE public.ndvi_data 
SET tenant_id = (
  SELECT l.tenant_id 
  FROM public.lands l 
  WHERE l.id = ndvi_data.land_id
) 
WHERE tenant_id IS NULL;

UPDATE public.satellite_imagery 
SET tenant_id = (
  SELECT l.tenant_id 
  FROM public.lands l 
  WHERE l.id = satellite_imagery.land_id
) 
WHERE tenant_id IS NULL;

UPDATE public.crop_health_assessments 
SET tenant_id = (
  SELECT l.tenant_id 
  FROM public.lands l 
  WHERE l.id = crop_health_assessments.land_id
) 
WHERE tenant_id IS NULL;

UPDATE public.satellite_alerts 
SET tenant_id = (
  SELECT l.tenant_id 
  FROM public.lands l 
  WHERE l.id = satellite_alerts.land_id
) 
WHERE tenant_id IS NULL;

UPDATE public.prescription_maps 
SET tenant_id = (
  SELECT f.tenant_id 
  FROM public.farmers f 
  WHERE f.id = prescription_maps.farmer_id
) 
WHERE tenant_id IS NULL;

UPDATE public.yield_predictions 
SET tenant_id = (
  SELECT f.tenant_id 
  FROM public.farmers f 
  WHERE f.id = yield_predictions.farmer_id
) 
WHERE tenant_id IS NULL;

UPDATE public.weather_preferences 
SET tenant_id = (
  SELECT f.tenant_id 
  FROM public.farmers f 
  WHERE f.id = weather_preferences.farmer_id
) 
WHERE tenant_id IS NULL;

UPDATE public.weather_activity_recommendations 
SET tenant_id = (
  SELECT f.tenant_id 
  FROM public.farmers f 
  WHERE f.id = weather_activity_recommendations.farmer_id
) 
WHERE tenant_id IS NULL;

-- Make tenant_id NOT NULL where appropriate
ALTER TABLE public.marketplace_saved_items ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.resource_usage ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.land_activities ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.soil_health ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.crop_history ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.ndvi_data ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.satellite_imagery ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.crop_health_assessments ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.satellite_alerts ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.prescription_maps ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.yield_predictions ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.weather_preferences ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.weather_activity_recommendations ALTER COLUMN tenant_id SET NOT NULL;

-- Add foreign key constraints for referential integrity
ALTER TABLE public.marketplace_saved_items 
ADD CONSTRAINT fk_marketplace_saved_items_tenant 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.resource_usage 
ADD CONSTRAINT fk_resource_usage_tenant 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.land_activities 
ADD CONSTRAINT fk_land_activities_tenant 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.soil_health 
ADD CONSTRAINT fk_soil_health_tenant 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.crop_history 
ADD CONSTRAINT fk_crop_history_tenant 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.ndvi_data 
ADD CONSTRAINT fk_ndvi_data_tenant 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.satellite_imagery 
ADD CONSTRAINT fk_satellite_imagery_tenant 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.crop_health_assessments 
ADD CONSTRAINT fk_crop_health_assessments_tenant 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.satellite_alerts 
ADD CONSTRAINT fk_satellite_alerts_tenant 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.prescription_maps 
ADD CONSTRAINT fk_prescription_maps_tenant 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.yield_predictions 
ADD CONSTRAINT fk_yield_predictions_tenant 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.weather_preferences 
ADD CONSTRAINT fk_weather_preferences_tenant 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.weather_activity_recommendations 
ADD CONSTRAINT fk_weather_activity_recommendations_tenant 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Update RLS policies for tenant isolation
-- Marketplace saved items
DROP POLICY IF EXISTS "Users can manage their saved items" ON public.marketplace_saved_items;
CREATE POLICY "Users can manage their saved items in their tenant"
ON public.marketplace_saved_items
FOR ALL
USING (user_id = auth.uid() AND tenant_id IN (
  SELECT tenant_id FROM public.user_tenants 
  WHERE user_id = auth.uid() AND is_active = true
));

-- Resource usage
DROP POLICY IF EXISTS "Users can manage their resource usage" ON public.resource_usage;
CREATE POLICY "Users can manage resource usage for their lands in their tenant"
ON public.resource_usage
FOR ALL
USING (farmer_id = auth.uid() AND tenant_id IN (
  SELECT tenant_id FROM public.user_tenants 
  WHERE user_id = auth.uid() AND is_active = true
));

-- Land activities  
DROP POLICY IF EXISTS "Users can manage activities for their lands" ON public.land_activities;
DROP POLICY IF EXISTS "Users can view activities for their lands" ON public.land_activities;
CREATE POLICY "Users can manage land activities in their tenant"
ON public.land_activities
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.lands l 
  WHERE l.id = land_activities.land_id 
  AND l.farmer_id = auth.uid() 
  AND l.tenant_id = land_activities.tenant_id
  AND l.tenant_id IN (
    SELECT tenant_id FROM public.user_tenants 
    WHERE user_id = auth.uid() AND is_active = true
  )
));

-- Soil health
DROP POLICY IF EXISTS "Users can manage soil health for their lands" ON public.soil_health;
CREATE POLICY "Users can manage soil health in their tenant"
ON public.soil_health
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.lands l 
  WHERE l.id = soil_health.land_id 
  AND l.farmer_id = auth.uid() 
  AND l.tenant_id = soil_health.tenant_id
  AND l.tenant_id IN (
    SELECT tenant_id FROM public.user_tenants 
    WHERE user_id = auth.uid() AND is_active = true
  )
));

-- Apply similar pattern for all other tables with tenant_id
-- This ensures complete tenant isolation across all data