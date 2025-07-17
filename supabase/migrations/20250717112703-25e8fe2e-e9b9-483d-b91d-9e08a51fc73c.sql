-- Weather system database schema

-- Weather stations and data sources
CREATE TABLE public.weather_stations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  station_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  elevation_meters INTEGER,
  data_source TEXT NOT NULL, -- 'openweather', 'tomorrow_io', 'government'
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Current weather conditions
CREATE TABLE public.weather_current (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  station_id UUID REFERENCES weather_stations(id),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  
  -- Basic weather data
  temperature_celsius DECIMAL(5, 2),
  feels_like_celsius DECIMAL(5, 2),
  humidity_percent INTEGER,
  pressure_hpa DECIMAL(7, 2),
  wind_speed_kmh DECIMAL(5, 2),
  wind_direction_degrees INTEGER,
  wind_gust_kmh DECIMAL(5, 2),
  visibility_km DECIMAL(5, 2),
  uv_index DECIMAL(3, 1),
  
  -- Precipitation
  rain_1h_mm DECIMAL(5, 2) DEFAULT 0,
  rain_24h_mm DECIMAL(5, 2) DEFAULT 0,
  snow_1h_mm DECIMAL(5, 2) DEFAULT 0,
  
  -- Sky conditions
  cloud_cover_percent INTEGER,
  weather_main TEXT, -- 'Clear', 'Rain', 'Clouds', etc.
  weather_description TEXT,
  weather_icon TEXT,
  
  -- Sun and moon
  sunrise TIMESTAMP WITH TIME ZONE,
  sunset TIMESTAMP WITH TIME ZONE,
  moon_phase DECIMAL(3, 2), -- 0 to 1
  
  -- Agricultural metrics
  evapotranspiration_mm DECIMAL(5, 2),
  soil_temperature_celsius DECIMAL(5, 2),
  soil_moisture_percent INTEGER,
  growing_degree_days DECIMAL(5, 2),
  
  data_source TEXT NOT NULL,
  observation_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Weather forecasts
CREATE TABLE public.weather_forecasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  station_id UUID REFERENCES weather_stations(id),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  
  -- Forecast details
  forecast_time TIMESTAMP WITH TIME ZONE NOT NULL,
  forecast_type TEXT NOT NULL, -- 'hourly', 'daily', 'monthly'
  
  -- Weather data (same structure as current)
  temperature_celsius DECIMAL(5, 2),
  temperature_min_celsius DECIMAL(5, 2),
  temperature_max_celsius DECIMAL(5, 2),
  feels_like_celsius DECIMAL(5, 2),
  humidity_percent INTEGER,
  pressure_hpa DECIMAL(7, 2),
  wind_speed_kmh DECIMAL(5, 2),
  wind_direction_degrees INTEGER,
  wind_gust_kmh DECIMAL(5, 2),
  uv_index DECIMAL(3, 1),
  
  -- Precipitation
  rain_probability_percent INTEGER,
  rain_amount_mm DECIMAL(5, 2) DEFAULT 0,
  snow_amount_mm DECIMAL(5, 2) DEFAULT 0,
  
  -- Sky conditions
  cloud_cover_percent INTEGER,
  weather_main TEXT,
  weather_description TEXT,
  weather_icon TEXT,
  
  -- Agricultural forecasts
  evapotranspiration_mm DECIMAL(5, 2),
  soil_temperature_celsius DECIMAL(5, 2),
  growing_degree_days DECIMAL(5, 2),
  
  data_source TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Weather alerts and warnings
CREATE TABLE public.weather_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id TEXT NOT NULL, -- External alert ID
  area_name TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Alert details
  event_type TEXT NOT NULL, -- 'frost', 'heat', 'rain', 'wind', 'drought'
  severity TEXT NOT NULL, -- 'minor', 'moderate', 'severe', 'extreme'
  urgency TEXT NOT NULL, -- 'immediate', 'expected', 'future'
  certainty TEXT NOT NULL, -- 'observed', 'likely', 'possible'
  
  title TEXT NOT NULL,
  description TEXT,
  instruction TEXT,
  
  -- Timing
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  
  -- Agricultural impact
  crop_impact_level TEXT, -- 'low', 'medium', 'high', 'critical'
  affected_activities TEXT[], -- ['spraying', 'harvesting', 'sowing']
  recommendations TEXT[],
  
  data_source TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User weather preferences and alert settings
CREATE TABLE public.weather_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id UUID NOT NULL,
  
  -- Location settings
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  preferred_station_id UUID REFERENCES weather_stations(id),
  
  -- Alert thresholds
  temperature_min_alert DECIMAL(5, 2) DEFAULT 5, -- Frost warning
  temperature_max_alert DECIMAL(5, 2) DEFAULT 40, -- Heat warning
  wind_speed_alert_kmh DECIMAL(5, 2) DEFAULT 25, -- High wind warning
  rain_probability_alert_percent INTEGER DEFAULT 80,
  humidity_high_alert_percent INTEGER DEFAULT 85,
  humidity_low_alert_percent INTEGER DEFAULT 30,
  
  -- Spray window preferences
  max_wind_speed_spray_kmh DECIMAL(5, 2) DEFAULT 15,
  min_temperature_spray_celsius DECIMAL(5, 2) DEFAULT 10,
  max_temperature_spray_celsius DECIMAL(5, 2) DEFAULT 35,
  max_rain_probability_spray_percent INTEGER DEFAULT 20,
  
  -- Notification preferences
  enable_push_notifications BOOLEAN DEFAULT true,
  enable_sms_alerts BOOLEAN DEFAULT true,
  enable_voice_alerts BOOLEAN DEFAULT false,
  alert_language TEXT DEFAULT 'hi',
  
  -- Activity scheduling
  enable_activity_recommendations BOOLEAN DEFAULT true,
  preferred_work_start_time TIME DEFAULT '06:00',
  preferred_work_end_time TIME DEFAULT '18:00',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Agricultural activity recommendations based on weather
CREATE TABLE public.weather_activity_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id UUID NOT NULL,
  land_id UUID REFERENCES lands(id),
  
  -- Activity details
  activity_type TEXT NOT NULL, -- 'spraying', 'sowing', 'harvesting', 'irrigation', 'fertilizing'
  recommended_date DATE NOT NULL,
  recommended_time_start TIME,
  recommended_time_end TIME,
  
  -- Weather conditions
  suitability_score INTEGER NOT NULL, -- 0-100
  weather_conditions JSONB,
  
  -- Recommendations
  title TEXT NOT NULL,
  description TEXT,
  precautions TEXT[],
  optimal_conditions TEXT[],
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'scheduled', 'completed', 'cancelled'
  is_critical BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Historical weather data for analysis
CREATE TABLE public.weather_historical (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  
  record_date DATE NOT NULL,
  temperature_avg_celsius DECIMAL(5, 2),
  temperature_min_celsius DECIMAL(5, 2),
  temperature_max_celsius DECIMAL(5, 2),
  rainfall_mm DECIMAL(7, 2),
  humidity_avg_percent INTEGER,
  wind_speed_avg_kmh DECIMAL(5, 2),
  
  -- Agricultural metrics
  evapotranspiration_mm DECIMAL(5, 2),
  growing_degree_days DECIMAL(5, 2),
  
  data_source TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all weather tables
ALTER TABLE public.weather_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_current ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_activity_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_historical ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Weather stations are public
CREATE POLICY "Anyone can view weather stations" ON public.weather_stations
  FOR SELECT USING (true);

-- Weather data is public
CREATE POLICY "Anyone can view current weather" ON public.weather_current
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view weather forecasts" ON public.weather_forecasts
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view weather alerts" ON public.weather_alerts
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view historical weather" ON public.weather_historical
  FOR SELECT USING (true);

-- User preferences are private
CREATE POLICY "Users can manage their weather preferences" ON public.weather_preferences
  FOR ALL USING (auth.uid()::text = farmer_id::text);

-- Activity recommendations are private
CREATE POLICY "Users can view their activity recommendations" ON public.weather_activity_recommendations
  FOR SELECT USING (auth.uid()::text = farmer_id::text);

CREATE POLICY "Users can update their activity recommendations" ON public.weather_activity_recommendations
  FOR UPDATE USING (auth.uid()::text = farmer_id::text);

-- Indexes for performance
CREATE INDEX idx_weather_current_location ON public.weather_current (latitude, longitude);
CREATE INDEX idx_weather_current_observation_time ON public.weather_current (observation_time DESC);
CREATE INDEX idx_weather_forecasts_location_time ON public.weather_forecasts (latitude, longitude, forecast_time);
CREATE INDEX idx_weather_forecasts_type ON public.weather_forecasts (forecast_type, forecast_time);
CREATE INDEX idx_weather_alerts_location_active ON public.weather_alerts (latitude, longitude, is_active);
CREATE INDEX idx_weather_alerts_time ON public.weather_alerts (start_time, end_time);
CREATE INDEX idx_weather_preferences_farmer ON public.weather_preferences (farmer_id);
CREATE INDEX idx_weather_recommendations_farmer_date ON public.weather_activity_recommendations (farmer_id, recommended_date);
CREATE INDEX idx_weather_historical_location_date ON public.weather_historical (latitude, longitude, record_date);

-- Functions for weather calculations
CREATE OR REPLACE FUNCTION calculate_evapotranspiration(
  temp_celsius DECIMAL,
  humidity_percent INTEGER,
  wind_speed_kmh DECIMAL,
  solar_radiation DECIMAL DEFAULT 15
) RETURNS DECIMAL AS $$
BEGIN
  -- Simplified Penman-Monteith equation for reference evapotranspiration
  -- This is a basic calculation - in production, use more sophisticated methods
  RETURN ROUND(
    (0.0023 * (temp_celsius + 17.8) * SQRT(ABS(humidity_percent - 50)) * 
     (solar_radiation / 2.45) * (1 + wind_speed_kmh / 67))::DECIMAL, 2
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_growing_degree_days(
  temp_max DECIMAL,
  temp_min DECIMAL,
  base_temp DECIMAL DEFAULT 10
) RETURNS DECIMAL AS $$
BEGIN
  -- Calculate growing degree days
  RETURN GREATEST(0, ((temp_max + temp_min) / 2) - base_temp);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_spray_suitability(
  temp_celsius DECIMAL,
  wind_speed_kmh DECIMAL,
  humidity_percent INTEGER,
  rain_probability_percent INTEGER
) RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 100;
BEGIN
  -- Reduce score based on adverse conditions
  IF temp_celsius < 10 OR temp_celsius > 35 THEN
    score := score - 30;
  END IF;
  
  IF wind_speed_kmh > 15 THEN
    score := score - 25;
  END IF;
  
  IF humidity_percent > 85 THEN
    score := score - 20;
  END IF;
  
  IF rain_probability_percent > 20 THEN
    score := score - (rain_probability_percent - 20);
  END IF;
  
  RETURN GREATEST(0, score);
END;
$$ LANGUAGE plpgsql;

-- Insert some sample weather stations for India
INSERT INTO public.weather_stations (station_code, name, latitude, longitude, data_source) VALUES
  ('IND_MUM_001', 'Mumbai Central', 19.0760, 72.8777, 'openweather'),
  ('IND_DEL_001', 'New Delhi Central', 28.6139, 77.2090, 'openweather'),
  ('IND_BLR_001', 'Bangalore Central', 12.9716, 77.5946, 'openweather'),
  ('IND_CHN_001', 'Chennai Central', 13.0827, 80.2707, 'openweather'),
  ('IND_KOL_001', 'Kolkata Central', 22.5726, 88.3639, 'openweather'),
  ('IND_HYD_001', 'Hyderabad Central', 17.3850, 78.4867, 'openweather'),
  ('IND_PUN_001', 'Pune Central', 18.5204, 73.8567, 'openweather'),
  ('IND_AHM_001', 'Ahmedabad Central', 23.0225, 72.5714, 'openweather'),
  ('IND_JAI_001', 'Jaipur Central', 26.9124, 75.7873, 'openweather'),
  ('IND_LUC_001', 'Lucknow Central', 26.8467, 80.9462, 'openweather');

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_weather_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_weather_preferences_updated_at
  BEFORE UPDATE ON public.weather_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_weather_preferences_updated_at();

CREATE TRIGGER update_weather_activity_recommendations_updated_at
  BEFORE UPDATE ON public.weather_activity_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_weather_preferences_updated_at();