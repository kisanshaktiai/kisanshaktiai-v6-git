
export interface FarmerProfile {
  id: string;
  farmer_code?: string;
  
  // Farming Details
  farming_experience_years?: number;
  farm_type?: string;
  total_land_acres?: number;
  primary_crops: string[];
  
  // Economic Status
  annual_income_range?: string;
  has_loan: boolean;
  loan_amount?: number;
  
  // Equipment & Resources
  has_tractor: boolean;
  has_irrigation: boolean;
  irrigation_type?: string;
  has_storage: boolean;
  
  // Associations
  associated_tenants: string[];
  preferred_dealer_id?: string;
  
  // Verification
  is_verified: boolean;
  verified_at?: string;
  verified_by?: string;
  verification_documents: any[];
  
  // Analytics
  app_install_date?: string;
  last_app_open?: string;
  total_app_opens: number;
  total_queries: number;
  
  created_at: string;
  updated_at: string;
}

export interface LandParcel {
  id: string;
  farmer_id: string;
  tenant_id?: string;
  
  // Basic Information
  name: string;
  survey_number?: string;
  area_acres: number;
  area_guntas?: number;
  
  // Location
  village?: string;
  taluka?: string;
  district?: string;
  state?: string;
  
  // Boundaries (GeoJSON)
  boundary?: any;
  center_point?: any;
  
  // Land Details
  land_type?: string;
  soil_type?: string;
  water_source?: string;
  elevation_meters?: number;
  slope_percentage?: number;
  
  // Current Status
  current_crop?: string;
  crop_stage?: string;
  last_sowing_date?: string;
  expected_harvest_date?: string;
  
  // Soil Health (Latest)
  soil_ph?: number;
  organic_carbon_percent?: number;
  nitrogen_kg_per_ha?: number;
  phosphorus_kg_per_ha?: number;
  potassium_kg_per_ha?: number;
  last_soil_test_date?: string;
  
  // Documents
  land_documents: string[];
  
  // Metadata
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CropCycle {
  id: string;
  land_id: string;
  farmer_id: string;
  
  // Crop Information
  crop_name: string;
  crop_variety?: string;
  crop_category?: string;
  
  // Timeline
  season?: string;
  sowing_date: string;
  expected_harvest_date?: string;
  actual_harvest_date?: string;
  
  // Inputs
  seed_variety?: string;
  seed_quantity_kg?: number;
  seed_cost?: number;
  
  // Yield
  expected_yield_quintal?: number;
  actual_yield_quintal?: number;
  
  // Economics
  total_investment?: number;
  total_revenue?: number;
  profit_loss?: number;
  
  // Quality
  quality_grade?: string;
  moisture_content?: number;
  
  // Market
  selling_price_per_quintal?: number;
  sold_to?: string;
  sold_at_location?: string;
  
  created_at: string;
  updated_at: string;
}
