
export type SubscriptionPlan = 'kisan' | 'shakti' | 'ai' | 'custom' | 'Kisan_Basic' | 'Shakti_Growth' | 'AI_Enterprise';

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  type: string;
  status: string;
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  business_registration: string | null;
  business_address: any | null;
  established_date: string | null;
  subscription_plan: SubscriptionPlan;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  trial_ends_at: string | null;
  max_farmers: number;
  max_dealers: number;
  max_products: number;
  max_storage_gb: number;
  max_api_calls_per_day: number;
  subdomain: string | null;
  custom_domain: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface UserProfile {
  id: string;
  mobile_number: string;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  date_of_birth: string | null;
  gender: 'male' | 'female' | 'other' | null;
  country: string | null;
  state: string | null;
  district: string | null;
  village: string | null;
  pincode: string | null;
  address_line1: string | null;
  address_line2: string | null;
  coordinates: any | null;
  preferred_language: string | null;
  notification_preferences: {
    sms: boolean;
    push: boolean;
    email: boolean;
    whatsapp: boolean;
    calls: boolean;
  };
  device_tokens: string[];
  expertise_areas: string[];
  mobile_number_verified: boolean;
  email_verified: boolean;
  is_profile_complete: boolean;
  last_seen: string | null;
  timezone: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  tenant_id: string | null;
  farming_experience_years: number | null;
  total_land_acres: number | null;
  primary_crops: string[] | null;
  has_irrigation: boolean;
  has_tractor: boolean;
  has_storage: boolean;
  annual_income_range: string | null;
  aadhaar_number: string | null;
}

export interface UserTenant {
  id: string;
  user_id: string;
  tenant_id: string;
  role: string;
  permissions: string[];
  is_active: boolean;
  joined_at: string;
  tenant?: Tenant;
}

export interface TenantBranding {
  id: string;
  tenant_id: string;
  primary_color: string | null;
  secondary_color: string | null;
  logo_url: string | null;
  font_family: string | null;
  custom_css: string | null;
}

export interface TenantFeatures {
  id: string;
  tenant_id: string;
  module_access: {
    [key: string]: boolean;
  };
  feature_flags: {
    [key: string]: boolean;
  };
  limits: {
    max_farmers: number;
    max_dealers: number;
    max_products: number;
    max_storage_gb: number;
    max_api_calls_per_day: number;
  };
  // Database fields
  advanced_analytics?: boolean;
  ai_chat?: boolean;
  api_access?: boolean;
  basic_analytics?: boolean;
  community_forum?: boolean;
  custom_reports?: boolean;
  drone_monitoring?: boolean;
  farmer_onboarding?: boolean;
  financial_tracking?: boolean;
  inventory_management?: boolean;
  marketplace_access?: boolean;
  mobile_app?: boolean;
  multi_language?: boolean;
  offline_mode?: boolean;
  payment_integration?: boolean;
  pest_disease_detection?: boolean;
  premium_support?: boolean;
  satellite_monitoring?: boolean;
  sms_notifications?: boolean;
  soil_health_monitoring?: boolean;
  supply_chain_tracking?: boolean;
  weather_alerts?: boolean;
  weather_forecasting?: boolean;
  white_label_mobile_app?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Utility functions for subscription plans
export const getSubscriptionPlanDisplayName = (plan: SubscriptionPlan): string => {
  const displayNames = {
    'kisan': 'Kisan Basic',
    'shakti': 'Shakti Growth',
    'ai': 'AI Enterprise',
    'custom': 'Custom Plan',
    'Kisan_Basic': 'Kisan Basic',
    'Shakti_Growth': 'Shakti Growth',
    'AI_Enterprise': 'AI Enterprise'
  };
  return displayNames[plan] || plan;
};

export const getSubscriptionPlanLimits = (plan: SubscriptionPlan) => {
  const limits = {
    'kisan': { farmers: 100, dealers: 10, products: 50, storage: 5, apiCalls: 1000 },
    'shakti': { farmers: 500, dealers: 25, products: 100, storage: 10, apiCalls: 5000 },
    'ai': { farmers: 1000, dealers: 50, products: 200, storage: 20, apiCalls: 10000 },
    'custom': { farmers: 1000, dealers: 50, products: 100, storage: 10, apiCalls: 10000 },
    'Kisan_Basic': { farmers: 100, dealers: 10, products: 50, storage: 5, apiCalls: 1000 },
    'Shakti_Growth': { farmers: 500, dealers: 25, products: 100, storage: 10, apiCalls: 5000 },
    'AI_Enterprise': { farmers: 1000, dealers: 50, products: 200, storage: 20, apiCalls: 10000 }
  };
  return limits[plan] || limits.kisan;
};
