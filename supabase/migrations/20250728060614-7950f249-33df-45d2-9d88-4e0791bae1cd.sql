-- First, let's add some missing columns for GPS metadata and location context
ALTER TABLE public.lands 
ADD COLUMN IF NOT EXISTS gps_accuracy_meters NUMERIC,
ADD COLUMN IF NOT EXISTS gps_recorded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS boundary_method TEXT DEFAULT 'manual' CHECK (boundary_method IN ('manual', 'gps_walk', 'gps_points', 'satellite')),
ADD COLUMN IF NOT EXISTS location_context JSONB DEFAULT '{}';

-- Add an index for geometry queries
CREATE INDEX IF NOT EXISTS idx_lands_boundary_gist ON public.lands USING GIST (boundary);

-- Add an index for location context searches
CREATE INDEX IF NOT EXISTS idx_lands_location_context_gin ON public.lands USING GIN (location_context);

-- Create a function to extract location details from coordinates
CREATE OR REPLACE FUNCTION public.get_location_context(lat DOUBLE PRECISION, lng DOUBLE PRECISION)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  context JSONB := '{}';
BEGIN
  -- This is a placeholder for reverse geocoding
  -- In production, this would call external geocoding service
  context := jsonb_build_object(
    'coordinates', jsonb_build_object('lat', lat, 'lng', lng),
    'accuracy', 'estimated',
    'source', 'coordinates'
  );
  
  RETURN context;
END;
$$;