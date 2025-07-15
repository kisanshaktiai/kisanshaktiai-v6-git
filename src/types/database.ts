
export type TenantType = 'AgriCompany' | 'Dealer' | 'NGO' | 'Government' | 'University' | 'SugarFactory' | 'Cooperative' | 'Insurance';

export type SubscriptionPlan = 'freemium' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'inactive' | 'suspended' | 'trial';

export type FarmerVerificationStatus = 'pending' | 'verified' | 'rejected';
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type LandType = 'irrigated' | 'rainfed' | 'fallow' | 'orchard' | 'greenhouse';
export type CropSeason = 'kharif' | 'rabi' | 'zaid' | 'perennial';

export interface MultilingualText {
  hi?: string;
  en?: string;
  [key: string]: string | undefined;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  type: TenantType;
  email: string;
  phone?: string;
  website?: string;
  description?: string;
  address?: any;
  contact_person?: any;
  settings?: any;
  max_farmers: number;
  max_dealers: number;
  max_lands: number;
  max_products: number;
  created_at: string;
  updated_at: string;
}

export interface TenantFeatures {
  id: string;
  tenant_id: string;
  ai_chat: boolean;
  weather_forecasts: boolean;
  crop_advisory: boolean;
  marketplace: boolean;
  dealer_network: boolean;
  analytics_dashboard: boolean;
  offline_sync: boolean;
  multilingual_support: boolean;
  voice_commands: boolean;
  video_calls: boolean;
  satellite_imagery: boolean;
  soil_testing: boolean;
  loan_assistance: boolean;
  insurance_claims: boolean;
  precision_farming: boolean;
  drone_integration: boolean;
  created_at: string;
  updated_at: string;
}

export interface TenantBranding {
  id: string;
  tenant_id: string;
  app_name: string;
  app_logo_url?: string;
  app_icon_url?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  languages: string[];
  default_language: string;
  custom_css?: string;
  fonts?: any;
  created_at: string;
  updated_at: string;
}

export interface TenantSubscription {
  id: string;
  tenant_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  monthly_price: number;
  currency: string;
  billing_cycle: number;
  started_at: string;
  ends_at?: string;
  trial_ends_at?: string;
  api_calls_limit: number;
  storage_limit_gb: number;
  bandwidth_limit_gb: number;
  last_payment_at?: string;
  next_billing_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Farmer {
  id: string;
  name: MultilingualText;
  phone: string;
  email?: string;
  date_of_birth?: string;
  gender?: Gender;
  village?: MultilingualText;
  tehsil?: MultilingualText;
  district?: MultilingualText;
  state?: MultilingualText;
  pincode?: string;
  coordinates?: any;
  verification_status: FarmerVerificationStatus;
  aadhaar_number?: string;
  pan_number?: string;
  voter_id?: string;
  education_level?: string;
  primary_language: string;
  secondary_languages: string[];
  farming_experience_years?: number;
  annual_income_range?: string;
  last_active_at?: string;
  app_version?: string;
  device_info?: any;
  created_at: string;
  updated_at: string;
}

export interface FarmerTenantAssociation {
  id: string;
  farmer_id: string;
  tenant_id: string;
  role: string;
  status: string;
  dealer_code?: string;
  field_officer_id?: string;
  onboarded_by?: string;
  onboarding_date: string;
  verification_documents: any[];
  last_interaction_at?: string;
  total_interactions: number;
  preferred_contact_method: string;
  created_at: string;
  updated_at: string;
}

export interface Land {
  id: string;
  farmer_id: string;
  tenant_id: string;
  name: MultilingualText;
  survey_number?: string;
  area_acres: number;
  boundary_polygon?: any;
  center_point?: any;
  land_type: LandType;
  soil_type?: string;
  irrigation_type?: string;
  water_source?: string;
  soil_ph?: number;
  organic_carbon?: number;
  nitrogen_level?: string;
  phosphorus_level?: string;
  potassium_level?: string;
  soil_test_date?: string;
  ownership_type?: string;
  lease_duration_months?: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  tenant_id: string;
  name: MultilingualText;
  description?: MultilingualText;
  category: string;
  subcategory?: string;
  brand?: string;
  price?: number;
  currency: string;
  unit: string;
  discount_percentage: number;
  stock_quantity: number;
  minimum_order_quantity: number;
  specifications: any;
  images: string[];
  documents: string[];
  is_active: boolean;
  is_featured: boolean;
  available_from?: string;
  available_until?: string;
  slug?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Dealer {
  id: string;
  tenant_id: string;
  name: MultilingualText;
  business_name?: MultilingualText;
  phone: string;
  email?: string;
  address?: any;
  coordinates?: any;
  coverage_area?: any;
  license_number?: string;
  gst_number?: string;
  bank_details?: any;
  total_sales: number;
  farmer_count: number;
  rating: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIInteraction {
  id: string;
  farmer_id: string;
  tenant_id: string;
  session_id?: string;
  query_text?: string;
  query_language: string;
  response_text?: string;
  interaction_type?: string;
  crop_context?: string;
  location_context?: any;
  weather_context?: any;
  processing_time_ms?: number;
  ai_model_version?: string;
  confidence_score?: number;
  user_rating?: number;
  user_feedback?: string;
  created_at: string;
}
