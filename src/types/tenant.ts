export type TenantType = 
  | 'agri_company' 
  | 'dealer' 
  | 'ngo' 
  | 'government' 
  | 'university' 
  | 'sugar_factory' 
  | 'cooperative' 
  | 'insurance';

export type TenantStatus = 'trial' | 'active' | 'suspended' | 'cancelled';

// Updated subscription plans to match database enum
export type SubscriptionPlan = 'kisan' | 'shakti' | 'ai';

export type UserRole = 
  | 'super_admin' 
  | 'tenant_owner' 
  | 'tenant_admin' 
  | 'tenant_manager' 
  | 'dealer' 
  | 'agent' 
  | 'farmer';

export type LanguageCode = 
  | 'en' | 'hi' | 'mr' | 'pa' | 'gu' 
  | 'te' | 'ta' | 'kn' | 'ml' | 'or' | 'bn' | 'ur' | 'ne';

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  type: TenantType;
  status: TenantStatus;
  
  // Contact Information
  owner_name?: string;
  owner_email?: string;
  owner_phone?: string;
  
  // Business Details
  business_registration?: string;
  business_address?: any;
  established_date?: string;
  
  // Subscription - Updated to use new plan types
  subscription_plan: SubscriptionPlan;
  subscription_start_date: string;
  subscription_end_date?: string;
  trial_ends_at?: string;
  
  // Limits
  max_farmers: number;
  max_dealers: number;
  max_products: number;
  max_storage_gb: number;
  max_api_calls_per_day: number;
  
  // White Label
  subdomain?: string;
  custom_domain?: string;
  
  // Metadata
  metadata: any;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface TenantBranding {
  id: string;
  tenant_id: string;
  
  // Colors
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  
  // Assets
  logo_url?: string;
  favicon_url?: string;
  splash_screen_url?: string;
  app_icon_url?: string;
  
  // Branding
  app_name: string;
  app_tagline?: string;
  company_description?: string;
  
  // Fonts
  font_family: string;
  custom_css?: string;
  
  // Email Templates
  email_header_html?: string;
  email_footer_html?: string;
  
  created_at: string;
  updated_at: string;
}

export interface TenantFeatures {
  id: string;
  tenant_id: string;
  
  // Core Features
  ai_chat: boolean;
  weather_forecast: boolean;
  marketplace: boolean;
  community_forum: boolean;
  
  // Advanced Features
  satellite_imagery: boolean;
  soil_testing: boolean;
  drone_monitoring: boolean;
  iot_integration: boolean;
  
  // Commerce Features
  ecommerce: boolean;
  payment_gateway: boolean;
  inventory_management: boolean;
  logistics_tracking: boolean;
  
  // Analytics Features
  basic_analytics: boolean;
  advanced_analytics: boolean;
  predictive_analytics: boolean;
  custom_reports: boolean;
  
  // Integration Features
  api_access: boolean;
  webhook_support: boolean;
  third_party_integrations: boolean;
  white_label_mobile_app: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  phone: string;
  phone_verified: boolean;
  
  // Personal Information
  full_name?: string;
  display_name?: string;
  date_of_birth?: string;
  gender?: string;
  
  // Location
  address_line1?: string;
  address_line2?: string;
  village?: string;
  taluka?: string;
  district?: string;
  state?: string;
  pincode?: string;
  country: string;
  coordinates?: any;
  
  // Preferences
  preferred_language: LanguageCode;
  notification_preferences: {
    sms: boolean;
    push: boolean;
    email: boolean;
    whatsapp: boolean;
    calls: boolean;
  };
  
  // Profile
  avatar_url?: string;
  bio?: string;
  expertise_areas: string[];
  
  // Metadata
  device_tokens: string[];
  last_active_at?: string;
  metadata: any;
  
  created_at: string;
  updated_at: string;
}

export interface UserTenant {
  id: string;
  user_id: string;
  tenant_id: string;
  role: UserRole;
  
  // Permissions
  permissions: string[];
  is_primary: boolean;
  
  // Status
  is_active: boolean;
  invited_by?: string;
  invited_at?: string;
  joined_at?: string;
  
  // Metadata
  department?: string;
  designation?: string;
  employee_id?: string;
  
  created_at: string;
  updated_at: string;
}

// Helper function to get plan display names
export const getSubscriptionPlanDisplayName = (plan: SubscriptionPlan): string => {
  const displayNames: Record<SubscriptionPlan, string> = {
    'kisan': 'Kisan (Basic)',
    'shakti': 'Shakti (Growth)', 
    'ai': 'AI (Enterprise)'
  };
  return displayNames[plan];
};

// Helper function to get plan limits
export const getSubscriptionPlanLimits = (plan: SubscriptionPlan) => {
  const limits = {
    'kisan': {
      farmers: 1000,
      dealers: 50,
      products: 100,
      storage: 10,
      api_calls: 10000
    },
    'shakti': {
      farmers: 5000,
      dealers: 200,
      products: 500,
      storage: 50,
      api_calls: 50000
    },
    'ai': {
      farmers: 20000,
      dealers: 1000,
      products: 2000,
      storage: 200,
      api_calls: 200000
    }
  };
  return limits[plan];
};
