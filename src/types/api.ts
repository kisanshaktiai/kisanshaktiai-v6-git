
export interface APIResponse<T = unknown> {
  data: T;
  success: boolean;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T = unknown> extends APIResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface Profile {
  id: string;
  full_name: string;
  mobile_number: string;
  village?: string;
  district?: string;
  state?: string;
  pin_code?: string;
  language?: string;
  created_at: string;
  updated_at: string;
}

export interface TenantData {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface TenantBranding {
  tenant_id: string;
  logo_url?: string;
  app_name?: string;
  app_tagline?: string;
  primary_color?: string;
  secondary_color?: string;
  background_color?: string;
  accent_color?: string;
  text_color?: string;
  font_family?: string;
  version: number;
  updated_at: string;
}

export interface TenantFeatures {
  tenant_id: string;
  ai_chat: boolean;
  weather_forecast: boolean;
  marketplace: boolean;
  community_forum: boolean;
  satellite_imagery: boolean;
  soil_testing: boolean;
  drone_monitoring: boolean;
  iot_integration: boolean;
  ecommerce: boolean;
  payment_gateway: boolean;
  inventory_management: boolean;
  logistics_tracking: boolean;
  basic_analytics: boolean;
  advanced_analytics: boolean;
  predictive_analytics: boolean;
  custom_reports: boolean;
  api_access: boolean;
  webhook_support: boolean;
  third_party_integrations: boolean;
  white_label_mobile_app: boolean;
  updated_at: string;
}

// Type guards for runtime validation
export const isProfile = (data: unknown): data is Profile => {
  return typeof data === 'object' && 
         data !== null && 
         'id' in data && 
         'full_name' in data && 
         'mobile_number' in data;
};

export const isTenantData = (data: unknown): data is TenantData => {
  return typeof data === 'object' && 
         data !== null && 
         'id' in data && 
         'name' in data && 
         'status' in data;
};
