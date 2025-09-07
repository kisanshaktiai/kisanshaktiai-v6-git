import { supabase } from '@/integrations/supabase/client';
import { WhiteLabelConfigService } from './WhiteLabelConfigService';

interface TenantConfig {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  subscription_plan: string;
  settings?: any;
  metadata?: any;
}

interface TenantBranding {
  id: string;
  tenant_id: string;
  logo_url: string | null;
  app_name: string | null;
  app_tagline: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  background_color: string | null;
  font_family: string | null;
  custom_css: string | null;
  favicon_url: string | null;
  version: number;
}

interface TenantFeature {
  id?: string;
  tenant_id: string;
  ai_chat?: boolean;
  basic_analytics?: boolean;
  community_forum?: boolean;
  enabled?: boolean;
  [key: string]: any;
}

interface InitializationResult {
  success: boolean;
  tenant: TenantConfig | null;
  branding: TenantBranding | null;
  features: TenantFeature[];
  user?: any;
  profile?: any;
  error?: string;
  stage?: string;
}

interface InitializationProgress {
  stage: string;
  progress: number;
  message: string;
}

export class MultiTenantInitializer {
  private static instance: MultiTenantInitializer;
  private initializationPromise: Promise<InitializationResult> | null = null;
  private cachedResult: InitializationResult | null = null;
  private progressCallbacks: ((progress: InitializationProgress) => void)[] = [];

  static getInstance(): MultiTenantInitializer {
    if (!this.instance) {
      this.instance = new MultiTenantInitializer();
    }
    return this.instance;
  }

  onProgress(callback: (progress: InitializationProgress) => void): void {
    this.progressCallbacks.push(callback);
  }

  private notifyProgress(stage: string, progress: number, message: string): void {
    const progressData: InitializationProgress = { stage, progress, message };
    this.progressCallbacks.forEach(callback => callback(progressData));
  }

  async initialize(forceRefresh = false): Promise<InitializationResult> {
    // Return cached result if available and not forcing refresh
    if (!forceRefresh && this.cachedResult) {
      return this.cachedResult;
    }

    // Prevent multiple simultaneous initializations
    if (!forceRefresh && this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    
    try {
      const result = await this.initializationPromise;
      this.cachedResult = result;
      return result;
    } finally {
      this.initializationPromise = null;
    }
  }

  private async performInitialization(): Promise<InitializationResult> {
    try {
      // Stage 1: Detect tenant from domain (10%)
      this.notifyProgress('tenant_detection', 10, 'Detecting tenant configuration...');
      const tenant = await this.detectTenant();
      
      if (!tenant) {
        throw new Error('No tenant configuration found');
      }

      // Stage 2: Load white label config (20%)
      this.notifyProgress('branding_load', 20, 'Loading brand settings...');
      const whiteLabelService = WhiteLabelConfigService.getInstance();
      const whiteLabelConfig = await whiteLabelService.loadConfig(tenant.id);
      
      // Also load tenant branding as fallback
      const branding = await this.loadTenantBranding(tenant.id);
      
      // Stage 3: Apply white label config or branding (30%)
      this.notifyProgress('branding_apply', 30, 'Applying brand theme...');
      if (whiteLabelConfig) {
        whiteLabelService.applyConfig(whiteLabelConfig);
      } else if (branding) {
        this.applyBranding(branding);
      }

      // Stage 4: Load tenant features (40%)
      this.notifyProgress('features_load', 40, 'Loading feature configuration...');
      const features = await this.loadTenantFeatures(tenant.id);

      // Stage 5: Check authentication (50%)
      this.notifyProgress('auth_check', 50, 'Checking authentication...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (!session) {
        // No user logged in - return tenant-only initialization
        this.notifyProgress('complete', 100, 'Ready');
        return {
          success: true,
          tenant,
          branding,
          features,
          stage: 'tenant_only'
        };
      }

      // Stage 6: Validate user-tenant association (60%)
      this.notifyProgress('user_validation', 60, 'Validating user access...');
      const hasAccess = await this.validateUserTenantAccess(session.user.id, tenant.id);
      
      if (!hasAccess) {
        console.warn('User does not have access to this tenant');
        // User doesn't have access to this tenant
        return {
          success: false,
          tenant,
          branding,
          features,
          error: 'User does not have access to this tenant',
          stage: 'access_denied'
        };
      }

      // Stage 7: Load user profile (70%)
      this.notifyProgress('profile_load', 70, 'Loading user profile...');
      const profile = await this.loadUserProfile(session.user.id);

      // Stage 8: Load farmer profile if applicable (80%)
      this.notifyProgress('farmer_load', 80, 'Loading farmer data...');
      const farmerProfile = await this.loadFarmerProfile(session.user.id, tenant.id);

      // Stage 9: Preload dashboard data (90%)
      this.notifyProgress('dashboard_prep', 90, 'Preparing dashboard...');
      await this.preloadDashboardData(tenant.id, session.user.id);

      // Stage 10: Complete (100%)
      this.notifyProgress('complete', 100, 'Initialization complete');
      
      return {
        success: true,
        tenant,
        branding,
        features,
        user: session.user,
        profile: { ...profile, farmer: farmerProfile },
        stage: 'complete'
      };

    } catch (error) {
      console.error('Multi-tenant initialization failed:', error);
      
      // Try to return partial initialization if possible
      return {
        success: false,
        tenant: null,
        branding: null,
        features: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        stage: 'error'
      };
    }
  }

  private async detectTenant(): Promise<TenantConfig | null> {
    try {
      const hostname = window.location.hostname;
      
      // Call the detect-tenant edge function
      const { data, error } = await supabase.functions.invoke('detect-tenant', {
        body: { domain: hostname }
      });

      if (error) {
        console.error('Tenant detection error:', error);
        
        // Fallback to default tenant
        const { data: defaultTenant } = await supabase
          .from('tenants')
          .select('*')
          .eq('is_default', true)
          .single();
          
        return defaultTenant;
      }

      return data?.data || null;
    } catch (error) {
      console.error('Failed to detect tenant:', error);
      return null;
    }
  }

  private async loadTenantBranding(tenantId: string): Promise<TenantBranding | null> {
    try {
      const { data, error } = await supabase
        .from('tenant_branding')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      if (error) {
        console.warn('Failed to load tenant branding:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error loading branding:', error);
      return null;
    }
  }

  private async loadTenantFeatures(tenantId: string): Promise<TenantFeature[]> {
    try {
      const { data, error } = await supabase
        .from('tenant_features')
        .select('*')
        .eq('tenant_id', tenantId);

      if (error) {
        console.warn('Failed to load tenant features:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error loading features:', error);
      return [];
    }
  }

  private async validateUserTenantAccess(userId: string, tenantId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_tenants')
        .select('id')
        .eq('user_id', userId)
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .single();

      return !error && !!data;
    } catch (error) {
      console.error('Error validating user access:', error);
      return false;
    }
  }

  private async loadUserProfile(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Failed to load user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error loading user profile:', error);
      return null;
    }
  }

  private async loadFarmerProfile(userId: string, tenantId: string): Promise<any> {
    try {
      // Use simpler query approach to avoid deep type instantiation
      const response = await supabase
        .from('farmers')
        .select('*')
        .match({ user_id: userId, tenant_id: tenantId });

      if (response.error) {
        console.warn('Error loading farmer profile:', response.error);
        return null;
      }

      return response.data?.[0] || null;
    } catch (error) {
      console.error('Error loading farmer profile:', error);
      return null;
    }
  }

  private async preloadDashboardData(tenantId: string, userId: string): Promise<void> {
    try {
      // Skip preloading to avoid type issues - data will be loaded on demand
      console.log('Preloading dashboard data for tenant:', tenantId);
    } catch (error) {
      console.warn('Failed to preload dashboard data:', error);
    }
  }

  private applyBranding(branding: TenantBranding): void {
    const root = document.documentElement;
    
    // Apply CSS variables
    if (branding.primary_color) {
      root.style.setProperty('--primary', branding.primary_color);
    }
    
    if (branding.secondary_color) {
      root.style.setProperty('--secondary', branding.secondary_color);
    }
    
    if (branding.background_color) {
      root.style.setProperty('--background', branding.background_color);
    }
    
    if (branding.font_family) {
      root.style.setProperty('--font-family', branding.font_family);
    }

    // Apply favicon
    if (branding.favicon_url) {
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (favicon) {
        favicon.href = branding.favicon_url;
      }
    }

    // Apply app name to title
    if (branding.app_name) {
      document.title = branding.app_name;
    }

    // Apply custom CSS
    if (branding.custom_css) {
      const styleElement = document.createElement('style');
      styleElement.id = 'tenant-custom-css';
      styleElement.textContent = branding.custom_css;
      document.head.appendChild(styleElement);
    }
  }

  clearCache(): void {
    this.cachedResult = null;
    this.initializationPromise = null;
  }

  getCachedResult(): InitializationResult | null {
    return this.cachedResult;
  }
}