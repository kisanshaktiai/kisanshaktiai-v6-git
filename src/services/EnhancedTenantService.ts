import { TenantDetectionService } from './TenantDetectionService';
import { PerformanceCache } from './PerformanceCache';
import { db, TenantConfig, ActivationHistory } from './offline/db';
import { supabase } from '@/integrations/supabase/client';

interface ActivationResult {
  success: boolean;
  tenant?: any;
  error?: string;
  cached?: boolean;
}

/**
 * Enhanced Tenant Service with Activation System and Performance Optimization
 */
export class EnhancedTenantService {
  private static instance: EnhancedTenantService;
  private cache = PerformanceCache.getInstance();
  private tenantDetection = TenantDetectionService.getInstance();
  private currentTenantId: string | null = null;

  static getInstance(): EnhancedTenantService {
    if (!this.instance) {
      this.instance = new EnhancedTenantService();
    }
    return this.instance;
  }

  /**
   * Validate activation code and setup tenant
   */
  async validateActivationCode(activationCode: string): Promise<ActivationResult> {
    console.log('🔑 Validating activation code:', activationCode);

    try {
      // Check if activation code was previously used on this device
      const existingActivation = await db.getActivationHistory(activationCode);
      if (existingActivation && existingActivation.isActive) {
        console.log('📱 Found existing activation for this device');
        
        const cachedConfig = await db.getTenantConfig(existingActivation.tenantId);
        if (cachedConfig) {
          await this.switchToTenant(existingActivation.tenantId, cachedConfig);
          return {
            success: true,
            tenant: cachedConfig,
            cached: true,
          };
        }
      }

      // Validate with server
      const { data, error } = await supabase.functions.invoke('validate-activation-code', {
        body: { activation_code: activationCode }
      });

      if (error) throw new Error(error.message);

      if (data?.tenant) {
        // Store activation history
        const deviceId = await this.getDeviceId();
        const activationHistory: ActivationHistory = {
          activationCode: activationCode.toUpperCase(),
          tenantId: data.tenant.id,
          activatedAt: Date.now(),
          deviceId,
          isActive: true,
        };

        await db.addActivationHistory(activationHistory);

        // Cache tenant configuration
        const tenantConfig: TenantConfig = {
          id: data.tenant.id,
          tenantId: data.tenant.id,
          config: data.tenant,
          branding: data.branding || {},
          features: data.features || {},
          activationCode: activationCode.toUpperCase(),
          isActive: true,
          lastSync: Date.now(),
        };

        await db.setTenantConfig(tenantConfig);
        await this.switchToTenant(data.tenant.id, tenantConfig);

        console.log('✅ Activation successful for tenant:', data.tenant.id);
        return {
          success: true,
          tenant: data.tenant,
          cached: false,
        };
      }

      throw new Error('Invalid activation code');
    } catch (error) {
      console.error('❌ Activation validation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Activation failed',
      };
    }
  }

  /**
   * Switch to a specific tenant with complete data isolation
   */
  async switchToTenant(tenantId: string, config?: TenantConfig): Promise<void> {
    console.log('🔄 Switching to tenant:', tenantId);

    // Clear cache for previous tenant
    if (this.currentTenantId && this.currentTenantId !== tenantId) {
      await this.cache.clearTenantCache(this.currentTenantId);
    }

    this.currentTenantId = tenantId;

    // Load or use provided config
    const tenantConfig = config || await db.getTenantConfig(tenantId);
    
    if (tenantConfig) {
      // Cache tenant data for immediate access
      await this.cache.set('tenant', 'config', tenantConfig.config, tenantId);
      await this.cache.set('tenant', 'branding', tenantConfig.branding, tenantId);
      await this.cache.set('tenant', 'features', tenantConfig.features, tenantId);

      // Apply branding immediately
      this.applyTenantBranding(tenantConfig.branding);

      // Start cache warm-up in background
      this.cache.warmUpCache(tenantId, 'current-user-id');
    }

    console.log('✅ Tenant switch completed:', tenantId);
  }

  /**
   * Apply tenant-specific branding to the app
   */
  private applyTenantBranding(branding: any): void {
    if (!branding) return;

    try {
      const root = document.documentElement;

      // Update CSS custom properties
      if (branding.primary_color) {
        root.style.setProperty('--primary', branding.primary_color);
      }
      if (branding.secondary_color) {
        root.style.setProperty('--secondary', branding.secondary_color);
      }
      if (branding.background_color) {
        root.style.setProperty('--background', branding.background_color);
      }

      // Update app title
      if (branding.app_name) {
        document.title = branding.app_name;
      }

      console.log('🎨 Tenant branding applied');
    } catch (error) {
      console.warn('⚠️ Failed to apply branding:', error);
    }
  }

  /**
   * Get default tenant based on domain or fallback
   */
  async getDefaultTenant(): Promise<any> {
    console.log('🏠 Loading default tenant...');

    try {
      // First check cache
      const cachedTenant = await this.cache.get('tenant', 'default');
      if (cachedTenant) {
        console.log('📦 Using cached default tenant');
        return cachedTenant;
      }

      // Use tenant detection service
      const detectedTenant = await this.tenantDetection.detectTenant();
      
      if (detectedTenant) {
        // Cache the detected tenant
        await this.cache.set('tenant', 'default', detectedTenant);
        await this.switchToTenant(detectedTenant.id);
        return detectedTenant;
      }

      // Fallback to default configuration
      const defaultTenant = {
        id: 'default',
        name: 'KisanShakti AI',
        slug: 'default',
        type: 'default',
        branding: {
          app_name: 'KisanShakti AI',
          primary_color: '#10b981',
          secondary_color: '#059669',
          logo_url: '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png',
        },
      };

      await this.cache.set('tenant', 'default', defaultTenant);
      await this.switchToTenant(defaultTenant.id);
      
      console.log('🔧 Using fallback default tenant');
      return defaultTenant;
    } catch (error) {
      console.error('❌ Failed to load default tenant:', error);
      throw error;
    }
  }

  /**
   * Get current tenant configuration
   */
  async getCurrentTenant(): Promise<any> {
    if (!this.currentTenantId) {
      return await this.getDefaultTenant();
    }

    const cachedConfig = await this.cache.get('tenant', 'config', this.currentTenantId);
    if (cachedConfig) {
      return cachedConfig;
    }

    // Fallback to database
    const dbConfig = await db.getTenantConfig(this.currentTenantId);
    return dbConfig?.config || await this.getDefaultTenant();
  }

  /**
   * Get device ID for activation tracking
   */
  private async getDeviceId(): Promise<string> {
    let deviceId = localStorage.getItem('kisanshakti_device_id');
    
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('kisanshakti_device_id', deviceId);
    }
    
    return deviceId;
  }

  /**
   * Check if activation is required
   */
  async isActivationRequired(): Promise<boolean> {
    // Check if we have any active tenant other than default
    const activeTenants = await db.tenantConfigs.where('isActive').equals(1).toArray();
    const hasNonDefaultTenant = activeTenants.some(t => t.tenantId !== 'default');
    
    // Check if we're on a custom domain that requires activation
    const hostname = window.location.hostname;
    const isCustomDomain = !hostname.includes('lovableproject.com') && 
                          !hostname.includes('localhost') && 
                          hostname !== '127.0.0.1';

    return isCustomDomain && !hasNonDefaultTenant;
  }

  /**
   * Get activation history for current device
   */
  async getActivationHistory(): Promise<ActivationHistory[]> {
    const deviceId = await this.getDeviceId();
    return await db.activationHistory.where('deviceId').equals(deviceId).toArray();
  }

  /**
   * Preload critical tenant data during app initialization
   */
  async preloadTenantData(tenantId?: string): Promise<void> {
    const targetTenantId = tenantId || this.currentTenantId || 'default';
    console.log('🚀 Preloading tenant data for:', targetTenantId);

    try {
      await Promise.allSettled([
        this.cache.preloadCriticalData(targetTenantId),
        this.preloadTenantTranslations(targetTenantId),
        this.preloadTenantAssets(targetTenantId),
      ]);

      console.log('✅ Tenant data preloading completed');
    } catch (error) {
      console.warn('⚠️ Tenant data preloading failed:', error);
    }
  }

  private async preloadTenantTranslations(tenantId: string): Promise<void> {
    // Load tenant-specific translations if available
    const translations = await this.cache.get('translations', 'tenant', tenantId);
    if (!translations) {
      console.log('📥 Tenant translations not cached');
    }
  }

  private async preloadTenantAssets(tenantId: string): Promise<void> {
    // Preload tenant-specific assets (logos, images, etc.)
    const branding = await this.cache.get('tenant', 'branding', tenantId);
    if (branding?.logo_url) {
      // Preload logo image
      const img = new Image();
      img.src = branding.logo_url;
    }
  }

  /**
   * Clean up resources when switching tenants
   */
  async cleanup(): Promise<void> {
    if (this.currentTenantId) {
      await this.cache.clearTenantCache(this.currentTenantId);
    }
    this.currentTenantId = null;
  }
}