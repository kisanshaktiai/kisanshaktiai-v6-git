export type SubscriptionPlan = 'kisan' | 'shakti' | 'ai';

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
  mobile_number: string; // Changed from phone to mobile_number
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
  phone_verified: boolean;
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
}
