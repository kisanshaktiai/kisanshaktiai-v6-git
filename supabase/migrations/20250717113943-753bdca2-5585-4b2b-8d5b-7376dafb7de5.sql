-- Enhance NDVI data table for advanced satellite monitoring
ALTER TABLE ndvi_data ADD COLUMN IF NOT EXISTS 
  evi_value DECIMAL(4,3),
  ndwi_value DECIMAL(4,3),
  savi_value DECIMAL(4,3),
  collection_id TEXT DEFAULT 'sentinel-2-l2a',
  scene_id TEXT,
  cloud_coverage DECIMAL(5,2),
  processing_level TEXT DEFAULT 'L2A',
  spatial_resolution INTEGER DEFAULT 10,
  tile_id TEXT,
  metadata JSONB DEFAULT '{}';

-- Create satellite imagery table for storing downloaded imagery
CREATE TABLE IF NOT EXISTS satellite_imagery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  land_id UUID NOT NULL REFERENCES lands(id) ON DELETE CASCADE,
  acquisition_date DATE NOT NULL,
  collection_id TEXT NOT NULL DEFAULT 'sentinel-2-l2a',
  scene_id TEXT NOT NULL,
  tile_id TEXT,
  cloud_coverage DECIMAL(5,2),
  spatial_resolution INTEGER DEFAULT 10,
  bounds JSONB NOT NULL, -- GeoJSON bounds
  image_urls JSONB NOT NULL, -- URLs for different bands
  processed_indices JSONB DEFAULT '{}', -- NDVI, EVI, NDWI, SAVI values
  download_status TEXT DEFAULT 'pending', -- pending, downloading, completed, failed
  file_size_mb DECIMAL(8,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create crop health assessments table
CREATE TABLE IF NOT EXISTS crop_health_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  land_id UUID NOT NULL REFERENCES lands(id) ON DELETE CASCADE,
  assessment_date DATE NOT NULL,
  overall_health_score INTEGER CHECK (overall_health_score >= 0 AND overall_health_score <= 100),
  ndvi_avg DECIMAL(4,3),
  ndvi_min DECIMAL(4,3),
  ndvi_max DECIMAL(4,3),
  ndvi_std DECIMAL(4,3),
  problem_areas JSONB DEFAULT '[]', -- Array of problem area polygons with severity
  stress_indicators JSONB DEFAULT '{}', -- water_stress, nutrient_stress, pest_stress
  growth_stage TEXT,
  predicted_yield DECIMAL(8,2),
  comparison_data JSONB DEFAULT '{}', -- Comparison with regional averages
  recommendations JSONB DEFAULT '[]',
  alert_level TEXT DEFAULT 'normal', -- normal, low, medium, high, critical
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create satellite alerts table
CREATE TABLE IF NOT EXISTS satellite_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  land_id UUID NOT NULL REFERENCES lands(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL,
  alert_type TEXT NOT NULL, -- ndvi_drop, growth_anomaly, stress_detected, comparison_alert
  severity TEXT NOT NULL, -- low, medium, high, critical
  title TEXT NOT NULL,
  description TEXT,
  affected_area_percentage DECIMAL(5,2),
  ndvi_change DECIMAL(4,3),
  trigger_values JSONB DEFAULT '{}',
  recommendations JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active', -- active, acknowledged, resolved
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

-- Create prescription maps table for variable rate application
CREATE TABLE IF NOT EXISTS prescription_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  land_id UUID NOT NULL REFERENCES lands(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL,
  map_type TEXT NOT NULL, -- fertilizer, irrigation, pesticide
  created_date DATE NOT NULL,
  zones JSONB NOT NULL, -- Management zones with application rates
  crop_name TEXT,
  growth_stage TEXT,
  map_data JSONB NOT NULL, -- Detailed prescription data
  applied_date DATE,
  application_method TEXT,
  total_area_acres DECIMAL(8,2),
  estimated_cost DECIMAL(10,2),
  status TEXT DEFAULT 'draft', -- draft, approved, applied, completed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE satellite_imagery ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_health_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE satellite_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_maps ENABLE ROW LEVEL SECURITY;

-- RLS Policies for satellite_imagery
CREATE POLICY "Users can view satellite imagery for their lands" ON satellite_imagery
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lands 
      WHERE lands.id = satellite_imagery.land_id 
      AND lands.farmer_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage satellite imagery for their lands" ON satellite_imagery
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM lands 
      WHERE lands.id = satellite_imagery.land_id 
      AND lands.farmer_id = auth.uid()
    )
  );

-- RLS Policies for crop_health_assessments
CREATE POLICY "Users can view health assessments for their lands" ON crop_health_assessments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lands 
      WHERE lands.id = crop_health_assessments.land_id 
      AND lands.farmer_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage health assessments for their lands" ON crop_health_assessments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM lands 
      WHERE lands.id = crop_health_assessments.land_id 
      AND lands.farmer_id = auth.uid()
    )
  );

-- RLS Policies for satellite_alerts
CREATE POLICY "Users can view their satellite alerts" ON satellite_alerts
  FOR SELECT USING (farmer_id = auth.uid());

CREATE POLICY "Users can manage their satellite alerts" ON satellite_alerts
  FOR ALL USING (farmer_id = auth.uid());

-- RLS Policies for prescription_maps
CREATE POLICY "Users can view their prescription maps" ON prescription_maps
  FOR SELECT USING (farmer_id = auth.uid());

CREATE POLICY "Users can manage their prescription maps" ON prescription_maps
  FOR ALL USING (farmer_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_satellite_imagery_land_date ON satellite_imagery(land_id, acquisition_date DESC);
CREATE INDEX IF NOT EXISTS idx_satellite_imagery_scene ON satellite_imagery(scene_id);
CREATE INDEX IF NOT EXISTS idx_crop_health_assessments_land_date ON crop_health_assessments(land_id, assessment_date DESC);
CREATE INDEX IF NOT EXISTS idx_satellite_alerts_farmer_status ON satellite_alerts(farmer_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prescription_maps_land_date ON prescription_maps(land_id, created_date DESC);
CREATE INDEX IF NOT EXISTS idx_ndvi_data_enhanced ON ndvi_data(land_id, date DESC, ndvi_value);

-- Function to calculate crop health score
CREATE OR REPLACE FUNCTION calculate_crop_health_score(
  p_ndvi_avg DECIMAL,
  p_growth_stage TEXT,
  p_season TEXT DEFAULT 'kharif'
) RETURNS INTEGER AS $$
DECLARE
  health_score INTEGER := 50;
  optimal_ndvi DECIMAL;
  ndvi_factor DECIMAL;
BEGIN
  -- Set optimal NDVI based on growth stage
  optimal_ndvi := CASE p_growth_stage
    WHEN 'germination' THEN 0.2
    WHEN 'vegetative' THEN 0.7
    WHEN 'flowering' THEN 0.8
    WHEN 'grain_filling' THEN 0.6
    WHEN 'maturity' THEN 0.4
    ELSE 0.6
  END;
  
  -- Calculate NDVI factor (closer to optimal = higher score)
  ndvi_factor := 1 - ABS(p_ndvi_avg - optimal_ndvi) / optimal_ndvi;
  
  -- Base score from NDVI
  health_score := GREATEST(0, LEAST(100, ROUND(ndvi_factor * 100)));
  
  -- Adjust for extremely low or high values
  IF p_ndvi_avg < 0.2 THEN
    health_score := GREATEST(health_score - 30, 0);
  ELSIF p_ndvi_avg > 0.9 THEN
    health_score := GREATEST(health_score - 10, 0);
  END IF;
  
  RETURN health_score;
END;
$$ LANGUAGE plpgsql;

-- Function to detect stress indicators
CREATE OR REPLACE FUNCTION detect_stress_indicators(
  p_ndvi_current DECIMAL,
  p_ndvi_previous DECIMAL,
  p_growth_stage TEXT
) RETURNS JSONB AS $$
DECLARE
  stress_indicators JSONB := '{}';
  ndvi_change DECIMAL;
BEGIN
  ndvi_change := p_ndvi_current - COALESCE(p_ndvi_previous, p_ndvi_current);
  
  -- Water stress detection
  IF p_ndvi_current < 0.3 AND p_growth_stage IN ('vegetative', 'flowering') THEN
    stress_indicators := stress_indicators || '{"water_stress": {"level": "high", "confidence": 0.8}}';
  ELSIF ndvi_change < -0.1 THEN
    stress_indicators := stress_indicators || '{"water_stress": {"level": "medium", "confidence": 0.6}}';
  END IF;
  
  -- Nutrient stress detection
  IF p_ndvi_current < 0.4 AND p_growth_stage = 'vegetative' THEN
    stress_indicators := stress_indicators || '{"nutrient_stress": {"level": "high", "confidence": 0.7}}';
  END IF;
  
  -- Pest/disease stress detection
  IF ndvi_change < -0.15 AND p_growth_stage IN ('vegetative', 'flowering') THEN
    stress_indicators := stress_indicators || '{"pest_stress": {"level": "high", "confidence": 0.6}}';
  END IF;
  
  RETURN stress_indicators;
END;
$$ LANGUAGE plpgsql;