
import { Json } from '@/integrations/supabase/types';

export interface Land {
  id: string;
  farmer_id: string;
  tenant_id: string;
  name: string;
  survey_number?: string;
  area_acres: number;
  boundary_polygon?: Json;
  center_point?: Json;
  ownership_type: 'owned' | 'leased' | 'shared' | 'rented';
  irrigation_source?: string;
  created_at: string;
  updated_at: string;
}

export interface SoilHealth {
  id: string;
  land_id: string;
  ph_level?: number;
  organic_carbon?: number;
  nitrogen_level?: 'low' | 'medium' | 'high';
  phosphorus_level?: 'low' | 'medium' | 'high';
  potassium_level?: 'low' | 'medium' | 'high';
  soil_type?: string;
  texture?: string;
  bulk_density?: number;
  test_date?: string;
  test_report_url?: string;
  source: 'manual' | 'soilgrid' | 'lab_test';
  created_at: string;
  updated_at: string;
}

export interface CropHistory {
  id: string;
  land_id: string;
  crop_name: string;
  variety?: string;
  season?: 'kharif' | 'rabi' | 'zaid' | 'perennial';
  planting_date?: string;
  harvest_date?: string;
  yield_kg_per_acre?: number;
  growth_stage?: string;
  status: 'active' | 'harvested' | 'failed';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface NDVIData {
  id: string;
  land_id: string;
  date: string;
  ndvi_value?: number;
  satellite_source: string;
  image_url?: string;
  cloud_cover?: number;
  created_at: string;
}

export interface LandActivity {
  id: string;
  land_id: string;
  activity_type: 'irrigation' | 'fertilizer' | 'pesticide' | 'plowing' | 'harvesting' | 'planting' | 'other';
  description?: string;
  quantity?: number;
  unit?: string;
  cost?: number;
  activity_date: string;
  notes?: string;
  created_at: string;
}

export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][]; // Array of linear rings
}

export interface LandWithDetails extends Land {
  soil_health?: SoilHealth;
  current_crop?: CropHistory;
  recent_ndvi?: NDVIData;
  recent_activities?: LandActivity[];
  health_score?: number;
}

// Helper types for creating lands
export interface LandCreateInput {
  name: string;
  farmer_id: string;
  tenant_id: string;
  area_acres: number;
  survey_number?: string;
  boundary_polygon?: Json;
  center_point?: Json;
  ownership_type?: 'owned' | 'leased' | 'shared' | 'rented';
  irrigation_source?: string;
}

export interface LandUpdateInput {
  name?: string;
  area_acres?: number;
  survey_number?: string;
  boundary_polygon?: Json;
  center_point?: Json;
  ownership_type?: 'owned' | 'leased' | 'shared' | 'rented';
  irrigation_source?: string;
}
