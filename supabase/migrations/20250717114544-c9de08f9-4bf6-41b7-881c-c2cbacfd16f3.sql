-- Enhance NDVI data table for advanced satellite monitoring
ALTER TABLE ndvi_data ADD COLUMN IF NOT EXISTS evi_value DECIMAL(4,3);
ALTER TABLE ndvi_data ADD COLUMN IF NOT EXISTS ndwi_value DECIMAL(4,3);
ALTER TABLE ndvi_data ADD COLUMN IF NOT EXISTS savi_value DECIMAL(4,3);
ALTER TABLE ndvi_data ADD COLUMN IF NOT EXISTS collection_id TEXT DEFAULT 'sentinel-2-l2a';
ALTER TABLE ndvi_data ADD COLUMN IF NOT EXISTS scene_id TEXT;
ALTER TABLE ndvi_data ADD COLUMN IF NOT EXISTS cloud_coverage DECIMAL(5,2);
ALTER TABLE ndvi_data ADD COLUMN IF NOT EXISTS processing_level TEXT DEFAULT 'L2A';
ALTER TABLE ndvi_data ADD COLUMN IF NOT EXISTS spatial_resolution INTEGER DEFAULT 10;
ALTER TABLE ndvi_data ADD COLUMN IF NOT EXISTS tile_id TEXT;
ALTER TABLE ndvi_data ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

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
  bounds JSONB NOT NULL,
  image_urls JSONB NOT NULL,
  processed_indices JSONB DEFAULT '{}',
  download_status TEXT DEFAULT 'pending',
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
  problem_areas JSONB DEFAULT '[]',
  stress_indicators JSONB DEFAULT '{}',
  growth_stage TEXT,
  predicted_yield DECIMAL(8,2),
  comparison_data JSONB DEFAULT '{}',
  recommendations JSONB DEFAULT '[]',
  alert_level TEXT DEFAULT 'normal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create satellite alerts table
CREATE TABLE IF NOT EXISTS satellite_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  land_id UUID NOT NULL REFERENCES lands(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  affected_area_percentage DECIMAL(5,2),
  ndvi_change DECIMAL(4,3),
  trigger_values JSONB DEFAULT '{}',
  recommendations JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

-- Create prescription maps table for variable rate application
CREATE TABLE IF NOT EXISTS prescription_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  land_id UUID NOT NULL REFERENCES lands(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL,
  map_type TEXT NOT NULL,
  created_date DATE NOT NULL,
  zones JSONB NOT NULL,
  crop_name TEXT,
  growth_stage TEXT,
  map_data JSONB NOT NULL,
  applied_date DATE,
  application_method TEXT,
  total_area_acres DECIMAL(8,2),
  estimated_cost DECIMAL(10,2),
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE satellite_imagery ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_health_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE satellite_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_maps ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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

CREATE POLICY "Users can view their satellite alerts" ON satellite_alerts
  FOR SELECT USING (farmer_id = auth.uid());

CREATE POLICY "Users can manage their satellite alerts" ON satellite_alerts
  FOR ALL USING (farmer_id = auth.uid());

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