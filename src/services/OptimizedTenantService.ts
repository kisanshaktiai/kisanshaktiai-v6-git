import { supabase } from '@/integrations/supabase/client';
import { TenantDetectionService } from './TenantDetectionService';

interface CachedTenantData {
  tenant: any;
  branding: any;
  features: any;
  timestamp: number;
  version: number;
}

/**
 * Optimized Tenant Service with unified queries and intelligent caching
 */
export class OptimizedTenantService {
  private static instance: OptimizedTenantService;
  private cache = new Map<string, CachedTenantData>();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
  private readonly MAX_CACHE_SIZE = 50;

  static getInstance(): OptimizedTenantService {
    if (!this.instance) {
      this.instance = new OptimizedTenantService();
    }
    return this.instance;
  }

  /**
   * Fetch unified tenant data with a single optimized query
   */
  async fetchUnifiedTenantData(tenantId: string): Promise<CachedTenantData> {
    console.log('🔍 Fetching unified tenant data for:', tenantId);

    // Check cache first
    const cachedData = this.getCachedData(tenantId);
    if (cachedData) {
      console.log('📦 Using cached tenant data');
      return cachedData;
    }

    try {
      // Single query with optimized joins and selected fields
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          id,
          name,
          slug,
          type,
          status,
          branding_version,
          branding_updated_at,
          created_at,
          updated_at,
          tenant_branding!inner (
            logo_url,
            app_name,
            app_tagline,
            primary_color,
            secondary_color,
            background_color,
            accent_color,
            text_color,
            font_family,
            version,
            updated_at
          ),
          tenant_features!inner (
            ai_chat,
            weather_forecast,
            marketplace,
            community_forum,
            satellite_imagery,
            soil_testing,
            drone_monitoring,
            iot_integration,
            ecommerce,
            payment_gateway,
            inventory_management,
            logistics_tracking,
            basic_analytics,
            advanced_analytics,
            predictive_analytics,
            custom_reports,
            api_access,
            webhook_support,
            third_party_integrations,
            white_label_mobile_app,
            updated_at
          )
        `)
        .eq('id', tenantId)
        .eq('status', 'active')
        .single();

      if (error) {
        console.error('❌ Failed to fetch tenant data:', error);
        throw new Error(`Failed to fetch tenant data: ${error.message}`);
      }

      if (!data) {
        throw new Error('No tenant data found');
      }

      // Transform and normalize the data
      const unifiedData: CachedTenantData = {
        tenant: {
          id: data.id,
          name: data.name,
          slug: data.slug,
          type: data.type,
          status: data.status,
          branding_version: data.branding_version,
          branding_updated_at: data.branding_updated_at,
          created_at: data.created_at,
          updated_at: data.updated_at,
        },
        branding: Array.isArray(data.tenant_branding) 
          ? data.tenant_branding[0] 
          : data.tenant_branding,
        features: Array.isArray(data.tenant_features) 
          ? data.tenant_features[0] 
          : data.tenant_features,
        timestamp: Date.now(),
        version: data.branding_version || 1,
      };

      // Cache the result
      this.setCachedData(tenantId, unifiedData);

      console.log('✅ Unified tenant data fetched and cached');
      return unifiedData;

    } catch (error) {
      console.error('❌ Error fetching unified tenant data:', error);
      throw error;
    }
  }

  /**
   * Get cached data if it's still valid
   */
  private getCachedData(tenantId: string): CachedTenantData | null {
    const cached = this.cache.get(tenantId);
    if (!cached) return null;

    const now = Date.now();
    const isExpired = now - cached.timestamp > this.CACHE_DURATION;
    
    if (isExpired) {
      this.cache.delete(tenantId);
      return null;
    }

    return cached;
  }

  /**
   * Cache tenant data with size management
   */
  private setCachedData(tenantId: string, data: CachedTenantData): void {
    // Manage cache size
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      // Remove oldest entries
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(tenantId, data);
  }

  /**
   * Optimized tenant detection with fallback strategy
   */
  async detectAndFetchTenant(): Promise<CachedTenantData> {
    console.log('🔍 Detecting and fetching tenant...');

    try {
      // Use existing tenant detection service
      const detectionService = TenantDetectionService.getInstance();
      const detectedTenant = await detectionService.detectTenant();

      if (detectedTenant?.id) {
        console.log('✅ Tenant detected:', detectedTenant.id);
        return await this.fetchUnifiedTenantData(detectedTenant.id);
      }

      // Fallback to default tenant
      console.log('🔧 Using default tenant fallback');
      return this.getDefaultTenantData();

    } catch (error) {
      console.error('❌ Tenant detection failed:', error);
      return this.getDefaultTenantData();
    }
  }

  /**
   * Get default tenant data as fallback
   */
  private getDefaultTenantData(): CachedTenantData {
    return {
      tenant: {
        id: 'default',
        name: 'KisanShakti AI',
        slug: 'default',
        type: 'default',
        status: 'active',
        branding_version: 1,
        branding_updated_at: new Date().toISOString(),
      },
      branding: {
        app_name: 'KisanShakti AI',
        app_tagline: 'Your smart farming journey starts here',
        primary_color: '#8BC34A',
        secondary_color: '#4CAF50',
        background_color: '#FFFFFF',
        accent_color: '#FF9800',
        text_color: '#1F2937',
        logo_url: '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png',
        version: 1,
      },
      features: {
        ai_chat: true,
        weather_forecast: true,
        marketplace: true,
        community_forum: true,
        basic_analytics: true,
        // Set other features to false for default tenant
      },
      timestamp: Date.now(),
      version: 1,
    };
  }

  /**
   * Invalidate cache for a specific tenant
   */
  invalidateCache(tenantId: string): void {
    this.cache.delete(tenantId);
    console.log('🗑️ Cache invalidated for tenant:', tenantId);
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ All tenant cache cleared');
  }

  /**
   * Preload tenant data for better performance
   */
  async preloadTenantData(tenantIds: string[]): Promise<void> {
    console.log('🚀 Preloading tenant data for:', tenantIds);

    const preloadPromises = tenantIds.map(async (tenantId) => {
      try {
        await this.fetchUnifiedTenantData(tenantId);
      } catch (error) {
        console.warn(`Failed to preload tenant ${tenantId}:`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
    console.log('✅ Tenant data preloading completed');
  }

  /**
   * Check if tenant data needs refresh based on version
   */
  needsRefresh(tenantId: string, currentVersion: number): boolean {
    const cached = this.getCachedData(tenantId);
    if (!cached) return true;

    return cached.version < currentVersion;
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      entries: Array.from(this.cache.keys()),
    };
  }
}