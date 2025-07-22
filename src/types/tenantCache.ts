
// Simple tenant cache types - separated to avoid circular references
export interface TenantBrandingData {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  app_name: string;
  app_tagline: string;
  logo_url: string;
  splash_screen_url?: string;
}

export interface TenantFeaturesData {
  ai_chat: boolean;
  weather_forecast: boolean;
  marketplace: boolean;
  community_forum: boolean;
  satellite_imagery: boolean;
  soil_testing: boolean;
  basic_analytics: boolean;
}

export interface SimpleTenantData {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  subscription_plan: string;
  branding: TenantBrandingData;
  features: TenantFeaturesData;
}
