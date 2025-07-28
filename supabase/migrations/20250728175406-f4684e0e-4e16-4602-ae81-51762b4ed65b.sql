-- Fix the RLS disabled issue - likely spatial_ref_sys table needs RLS
-- This table is from PostGIS extension and needs RLS enabled
ALTER TABLE IF EXISTS public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;

-- Create a policy for spatial_ref_sys (this is reference data, should be readable by all)
DROP POLICY IF EXISTS "Allow public read access to spatial reference systems" ON public.spatial_ref_sys;
CREATE POLICY "Allow public read access to spatial reference systems" 
ON public.spatial_ref_sys 
FOR SELECT 
USING (true);