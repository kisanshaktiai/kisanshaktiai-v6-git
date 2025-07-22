
import { supabase } from '@/integrations/supabase/client';
import { TenantBrandingData, TenantFeaturesData, SimpleTenantData } from '@/types/tenantCache';

export class TenantDataBuilder {
  static getDefaultBranding(): TenantBrandingData {
    return {
      primary_color: '#8BC34A',
      secondary_color: '#4CAF50',
      accent_color: '#689F38',
      background_color: '#FFFFFF',
      text_color: '#1F2937',
      app_name: 'KisanShakti AI',
      app_tagline: 'INTELLIGENT AI GURU FOR FARMERS',
      logo_url: '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png',
      splash_screen_url: '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png'
    };
  }

  static getDefaultFeatures(): TenantFeaturesData {
    return {
      ai_chat: true,
      weather_forecast: true,
      marketplace: true,
      community_forum: true,
      satellite_imagery: true,
      soil_testing: true,
      basic_analytics: true
    };
  }

  static async buildFromTenant(tenantRow: any): Promise<SimpleTenantData> {
    // Fetch branding data
    const brandingQuery = await supabase
      .from('tenant_branding')
      .select('*')
      .eq('tenant_id', tenantRow.id)
      .single();

    // Fetch features data
    const featuresQuery = await supabase
      .from('tenant_features')
      .select('*')
      .eq('tenant_id', tenantRow.id)
      .single();

    const branding = brandingQuery.data || this.getDefaultBranding();
    const features = featuresQuery.data || this.getDefaultFeatures();

    return {
      id: tenantRow.id,
      name: tenantRow.name,
      slug: tenantRow.slug,
      type: tenantRow.type,
      status: tenantRow.status,
      subscription_plan: tenantRow.subscription_plan,
      branding: {
        primary_color: branding.primary_color || this.getDefaultBranding().primary_color,
        secondary_color: branding.secondary_color || this.getDefaultBranding().secondary_color,
        accent_color: branding.accent_color || this.getDefaultBranding().accent_color,
        background_color: branding.background_color || this.getDefaultBranding().background_color,
        text_color: branding.text_color || this.getDefaultBranding().text_color,
        app_name: branding.app_name || this.getDefaultBranding().app_name,
        app_tagline: branding.app_tagline || this.getDefaultBranding().app_tagline,
        logo_url: branding.logo_url || this.getDefaultBranding().logo_url,
        splash_screen_url: branding.splash_screen_url || this.getDefaultBranding().splash_screen_url
      },
      features: {
        ai_chat: features.ai_chat ?? this.getDefaultFeatures().ai_chat,
        weather_forecast: features.weather_forecast ?? this.getDefaultFeatures().weather_forecast,
        marketplace: features.marketplace ?? this.getDefaultFeatures().marketplace,
        community_forum: features.community_forum ?? this.getDefaultFeatures().community_forum,
        satellite_imagery: features.satellite_imagery ?? this.getDefaultFeatures().satellite_imagery,
        soil_testing: features.soil_testing ?? this.getDefaultFeatures().soil_testing,
        basic_analytics: features.basic_analytics ?? this.getDefaultFeatures().basic_analytics
      }
    };
  }
}
