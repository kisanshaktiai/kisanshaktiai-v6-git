
-- Create enhanced lands table with geospatial support
CREATE TABLE public.lands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id UUID REFERENCES auth.users NOT NULL,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  survey_number TEXT,
  area_acres DECIMAL(10,3) NOT NULL,
  boundary_polygon JSONB, -- GeoJSON polygon
  center_point JSONB, -- GeoJSON point
  ownership_type TEXT DEFAULT 'owned' CHECK (ownership_type IN ('owned', 'leased', 'shared', 'rented')),
  irrigation_source TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create soil health table
CREATE TABLE public.soil_health (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  land_id UUID REFERENCES public.lands(id) ON DELETE CASCADE NOT NULL,
  ph_level DECIMAL(3,1),
  organic_carbon DECIMAL(5,2),
  nitrogen_level TEXT CHECK (nitrogen_level IN ('low', 'medium', 'high')),
  phosphorus_level TEXT CHECK (phosphorus_level IN ('low', 'medium', 'high')),
  potassium_level TEXT CHECK (potassium_level IN ('low', 'medium', 'high')),
  soil_type TEXT,
  texture TEXT,
  bulk_density DECIMAL(3,2),
  test_date DATE,
  test_report_url TEXT,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'soilgrid', 'lab_test')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create crop history table
CREATE TABLE public.crop_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  land_id UUID REFERENCES public.lands(id) ON DELETE CASCADE NOT NULL,
  crop_name TEXT NOT NULL,
  variety TEXT,
  season TEXT CHECK (season IN ('kharif', 'rabi', 'zaid', 'perennial')),
  planting_date DATE,
  harvest_date DATE,
  yield_kg_per_acre DECIMAL(8,2),
  growth_stage TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'harvested', 'failed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create NDVI data table
CREATE TABLE public.ndvi_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  land_id UUID REFERENCES public.lands(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  ndvi_value DECIMAL(4,3) CHECK (ndvi_value >= -1 AND ndvi_value <= 1),
  satellite_source TEXT DEFAULT 'sentinel-2',
  image_url TEXT,
  cloud_cover DECIMAL(3,1),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create land activities table
CREATE TABLE public.land_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  land_id UUID REFERENCES public.lands(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('irrigation', 'fertilizer', 'pesticide', 'plowing', 'harvesting', 'planting', 'other')),
  description TEXT,
  quantity DECIMAL(8,2),
  unit TEXT,
  cost DECIMAL(10,2),
  activity_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for lands
ALTER TABLE public.lands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own lands" 
  ON public.lands 
  FOR SELECT 
  USING (auth.uid() = farmer_id);

CREATE POLICY "Users can create their own lands" 
  ON public.lands 
  FOR INSERT 
  WITH CHECK (auth.uid() = farmer_id);

CREATE POLICY "Users can update their own lands" 
  ON public.lands 
  FOR UPDATE 
  USING (auth.uid() = farmer_id);

CREATE POLICY "Users can delete their own lands" 
  ON public.lands 
  FOR DELETE 
  USING (auth.uid() = farmer_id);

-- Add RLS policies for related tables
ALTER TABLE public.soil_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ndvi_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.land_activities ENABLE ROW LEVEL SECURITY;

-- Soil health policies
CREATE POLICY "Users can view soil health for their lands" 
  ON public.soil_health 
  FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.lands WHERE lands.id = soil_health.land_id AND lands.farmer_id = auth.uid()));

CREATE POLICY "Users can manage soil health for their lands" 
  ON public.soil_health 
  FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.lands WHERE lands.id = soil_health.land_id AND lands.farmer_id = auth.uid()));

-- Crop history policies
CREATE POLICY "Users can view crop history for their lands" 
  ON public.crop_history 
  FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.lands WHERE lands.id = crop_history.land_id AND lands.farmer_id = auth.uid()));

CREATE POLICY "Users can manage crop history for their lands" 
  ON public.crop_history 
  FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.lands WHERE lands.id = crop_history.land_id AND lands.farmer_id = auth.uid()));

-- NDVI data policies
CREATE POLICY "Users can view NDVI data for their lands" 
  ON public.ndvi_data 
  FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.lands WHERE lands.id = ndvi_data.land_id AND lands.farmer_id = auth.uid()));

CREATE POLICY "Users can manage NDVI data for their lands" 
  ON public.ndvi_data 
  FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.lands WHERE lands.id = ndvi_data.land_id AND lands.farmer_id = auth.uid()));

-- Land activities policies
CREATE POLICY "Users can view activities for their lands" 
  ON public.land_activities 
  FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.lands WHERE lands.id = land_activities.land_id AND lands.farmer_id = auth.uid()));

CREATE POLICY "Users can manage activities for their lands" 
  ON public.land_activities 
  FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.lands WHERE lands.id = land_activities.land_id AND lands.farmer_id = auth.uid()));

-- Create indexes for better performance
CREATE INDEX idx_lands_farmer_id ON public.lands(farmer_id);
CREATE INDEX idx_soil_health_land_id ON public.soil_health(land_id);
CREATE INDEX idx_crop_history_land_id ON public.crop_history(land_id);
CREATE INDEX idx_ndvi_data_land_id_date ON public.ndvi_data(land_id, date);
CREATE INDEX idx_land_activities_land_id_date ON public.land_activities(land_id, activity_date);

-- Create function to calculate land health score
CREATE OR REPLACE FUNCTION calculate_land_health_score(land_uuid UUID)
RETURNS DECIMAL(3,1)
LANGUAGE plpgsql
AS $$
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
$$;
