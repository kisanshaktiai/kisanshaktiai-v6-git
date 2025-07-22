
import type { TenantBrandingData, TenantFeaturesData, SimpleTenantData } from '@/types/tenantCache';

interface BasicTenant {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  subscription_plan: string;
}

export class TenantDataBuilder {
  static buildTenantData(
    tenantRow: BasicTenant,
    brandingData: any,
    featuresData: any
  ): SimpleTenantData {
    const branding: TenantBrandingData = {
      primary_color: brandingData?.primary_color || '#8BC34A',
      secondary_color: brandingData?.secondary_color || '#4CAF50',
      accent_color: brandingData?.accent_color || '#689F38',
      background_color: brandingData?.background_color || '#FFFFFF',
      text_color: brandingData?.text_color || '#1F2937',
      app_name: brandingData?.app_name || tenantRow.name || 'KisanShakti AI',
      app_tagline: brandingData?.app_tagline || 'INTELLIGENT AI GURU FOR FARMERS',
      logo_url: brandingData?.logo_url || '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png',
      splash_screen_url: brandingData?.splash_screen_url || brandingData?.logo_url || '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png'
    };

    const features: TenantFeaturesData = {
      ai_chat: featuresData?.ai_chat ?? true,
      weather_forecast: featuresData?.weather_forecast ?? true,
      marketplace: featuresData?.marketplace ?? true,
      community_forum: featuresData?.community_forum ?? true,
      satellite_imagery: featuresData?.satellite_imagery ?? true,
      soil_testing: featuresData?.soil_testing ?? true,
      basic_analytics: featuresData?.basic_analytics ?? true
    };

    return {
      id: tenantRow.id,
      name: tenantRow.name,
      slug: tenantRow.slug,
      type: tenantRow.type,
      status: tenantRow.status,
      subscription_plan: tenantRow.subscription_plan,
      branding,
      features
    };
  }
}
