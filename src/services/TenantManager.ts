import { supabase } from '@/integrations/supabase/client';
import { applyTenantTheme, resetTenantTheme } from '@/utils/tenantTheme';
import { SubscriptionPlan, getSubscriptionPlanDisplayName } from '@/types/tenant';

interface TenantBranding {
  app_name?: string;
  app_tagline?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
  font_family?: string;
}

interface TenantFeatures {
  ai_chat?: boolean;
  weather_forecast?: boolean;
  marketplace?: boolean;
  basic_analytics?: boolean;
  community_forum?: boolean;
  satellite_imagery?: boolean;
  soil_testing?: boolean;
  drone_monitoring?: boolean;
  iot_integration?: boolean;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  subscription_plan: SubscriptionPlan;
  branding?: TenantBranding;
  features?: TenantFeatures;
}

class TenantManager {
  private static instance: TenantManager;
  private currentTenant: Tenant | null = null;
  private tenantBranding: TenantBranding | null = null;
  private tenantFeatures: TenantFeatures | null = null;
  private realtimeChannel: any = null;

  static getInstance(): TenantManager {
    if (!TenantManager.instance) {
      TenantManager.instance = new TenantManager();
    }
    return TenantManager.instance;
  }

  async initializeTenant(tenantId?: string): Promise<boolean> {
    try {
      console.log('TenantManager: Initializing tenant:', tenantId);

      // Get default tenant if no specific ID provided
      if (!tenantId) {
        try {
          const { data: defaultTenant, error } = await supabase.functions.invoke('tenant-default', {
            method: 'GET'
          });

          if (error) {
            console.error('TenantManager: Error getting default tenant:', error);
            this.setFallbackTenant();
            return false;
          }

          if (defaultTenant?.id) {
            tenantId = defaultTenant.id;
          }
        } catch (error) {
          console.error('TenantManager: Failed to get default tenant:', error);
          this.setFallbackTenant();
          return false;
        }
      }

      if (!tenantId) {
        console.log('TenantManager: No tenant ID available, using fallback');
        this.setFallbackTenant();
        return true;
      }

      // Load tenant data
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .maybeSingle();

      if (tenantError) {
        console.error('TenantManager: Error loading tenant:', tenantError);
        this.setFallbackTenant();
        return false;
      }

      if (!tenant) {
        console.log('TenantManager: Tenant not found, using fallback');
        this.setFallbackTenant();
        return true;
      }

      this.currentTenant = {
        ...tenant,
        subscription_plan: tenant.subscription_plan as SubscriptionPlan
      };

      // Load branding and features in parallel
      const [brandingResult, featuresResult] = await Promise.allSettled([
        this.loadTenantBranding(tenantId),
        this.loadTenantFeatures(tenantId)
      ]);

      // Apply branding immediately
      if (this.tenantBranding) {
        applyTenantTheme(this.tenantBranding);
        this.updateDocumentTitle();
      }

      // Set up realtime subscriptions
      this.setupRealtimeSubscriptions(tenantId);

      console.log('TenantManager: Tenant initialized successfully');
      return true;

    } catch (error) {
      console.error('TenantManager: Critical error initializing tenant:', error);
      this.setFallbackTenant();
      return false;
    }
  }

  private async loadTenantBranding(tenantId: string) {
    try {
      const { data: branding } = await supabase
        .from('tenant_branding')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      this.tenantBranding = branding || this.getDefaultBranding();
    } catch (error) {
      console.warn('TenantManager: Error loading branding:', error);
      this.tenantBranding = this.getDefaultBranding();
    }
  }

  private async loadTenantFeatures(tenantId: string) {
    try {
      const { data: features } = await supabase
        .from('tenant_features')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      this.tenantFeatures = features || this.getDefaultFeatures();
    } catch (error) {
      console.warn('TenantManager: Error loading features:', error);
      this.tenantFeatures = this.getDefaultFeatures();
    }
  }

  private setFallbackTenant() {
    this.currentTenant = {
      id: 'fallback-tenant-id',
      name: 'KisanShakti AI',
      slug: 'default',
      type: 'default',
      status: 'active',
      subscription_plan: 'kisan' as SubscriptionPlan
    };
    this.tenantBranding = this.getDefaultBranding();
    this.tenantFeatures = this.getDefaultFeatures();
    
    if (this.tenantBranding) {
      applyTenantTheme(this.tenantBranding);
      this.updateDocumentTitle();
    }
  }

  private getDefaultBranding(): TenantBranding {
    return {
      app_name: 'KisanShakti AI',
      app_tagline: 'Your Smart Farming Assistant',
      logo_url: '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png',
      primary_color: '#8BC34A',
      secondary_color: '#4CAF50',
      accent_color: '#689F38',
      background_color: '#FFFFFF',
      text_color: '#1F2937'
    };
  }

  private getDefaultFeatures(): TenantFeatures {
    return {
      ai_chat: true,
      weather_forecast: true,
      marketplace: true,
      basic_analytics: true,
      community_forum: true,
      satellite_imagery: false,
      soil_testing: true,
      drone_monitoring: false,
      iot_integration: false
    };
  }

  private updateDocumentTitle() {
    if (this.tenantBranding?.app_name) {
      document.title = this.tenantBranding.app_name;
    }
  }

  private setupRealtimeSubscriptions(tenantId: string) {
    // Clean up existing subscriptions
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
    }

    // Subscribe to tenant-specific realtime updates
    this.realtimeChannel = supabase
      .channel(`tenant-${tenantId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'crop_health_assessments',
        filter: `tenant_id=eq.${tenantId}`
      }, (payload) => {
        this.handleRealtimeUpdate('crop_health', payload);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'weather_alerts',
        filter: `tenant_id=eq.${tenantId}`
      }, (payload) => {
        this.handleRealtimeUpdate('weather_alerts', payload);
      })
      .subscribe();

    console.log('TenantManager: Realtime subscriptions set up for tenant:', tenantId);
  }

  private handleRealtimeUpdate(type: string, payload: any) {
    console.log(`TenantManager: Realtime update for ${type}:`, payload);
    
    // Dispatch custom events for components to listen to
    window.dispatchEvent(new CustomEvent(`tenant-realtime-${type}`, {
      detail: payload
    }));
  }

  // Public API
  getCurrentTenant(): Tenant | null {
    return this.currentTenant;
  }

  getTenantBranding(): TenantBranding | null {
    return this.tenantBranding;
  }

  getTenantFeatures(): TenantFeatures | null {
    return this.tenantFeatures;
  }

  isFeatureEnabled(feature: keyof TenantFeatures): boolean {
    return this.tenantFeatures?.[feature] ?? false;
  }

  getCurrentTenantId(): string {
    return this.currentTenant?.id || 'fallback-tenant-id';
  }

  getSubscriptionPlanInfo() {
    if (!this.currentTenant) return null;
    
    return {
      plan: this.currentTenant.subscription_plan,
      displayName: getSubscriptionPlanDisplayName(this.currentTenant.subscription_plan)
    };
  }

  async switchTenant(tenantId: string): Promise<boolean> {
    // Reset current state
    resetTenantTheme();
    this.cleanup();
    
    // Initialize new tenant
    return await this.initializeTenant(tenantId);
  }

  cleanup() {
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
  }
}

export const tenantManager = TenantManager.getInstance();
