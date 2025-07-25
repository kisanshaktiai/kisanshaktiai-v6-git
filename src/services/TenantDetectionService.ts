
import { supabase } from '@/integrations/supabase/client';

interface TenantBranding {
  logo_url?: string;
  app_name?: string;
  app_tagline?: string;
  primary_color?: string;
  secondary_color?: string;
  background_color?: string;
}

interface TenantData {
  id: string;
  name: string;
  slug: string;
  type: string;
  is_default?: boolean;
  branding?: TenantBranding;
}

export class TenantDetectionService {
  private static instance: TenantDetectionService;
  private cachedDefaultTenant: TenantData | null = null;
  private defaultTenantId: string | null = null;

  static getInstance(): TenantDetectionService {
    if (!this.instance) {
      this.instance = new TenantDetectionService();
    }
    return this.instance;
  }

  async clearCache(): Promise<void> {
    this.cachedDefaultTenant = null;
    this.defaultTenantId = null;
    
    // Clear localStorage cache as well
    localStorage.removeItem('defaultTenantId');
    localStorage.removeItem('defaultTenantData');
  }

  async detectTenant(): Promise<TenantData | null> {
    try {
      // Try to get default tenant first
      if (!this.cachedDefaultTenant) {
        await this.loadDefaultTenant();
      }

      // Check for domain-based tenant detection
      const hostname = window.location.hostname;
      
      // Skip domain detection for localhost and default domains
      if (hostname !== 'localhost' && !hostname.includes('lovable.app')) {
        const { data: domainTenant } = await supabase
          .from('domain_mappings')
          .select(`
            tenant_id,
            tenants!inner (
              id,
              name,
              slug,
              type,
              tenant_branding (
                logo_url,
                app_name,
                app_tagline,
                primary_color,
                secondary_color,
                background_color
              )
            )
          `)
          .eq('domain', hostname)
          .eq('is_active', true)
          .single();

        if (domainTenant?.tenants) {
          const tenant = domainTenant.tenants;
          return {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            type: tenant.type,
            branding: tenant.tenant_branding?.[0] || {}
          };
        }
      }

      // Check for subdomain-based tenant detection
      if (hostname.includes('.')) {
        const subdomain = hostname.split('.')[0];
        
        const { data: subdomainTenant } = await supabase
          .from('tenants')
          .select(`
            id,
            name,
            slug,
            type,
            tenant_branding (
              logo_url,
              app_name,
              app_tagline,
              primary_color,
              secondary_color,
              background_color
            )
          `)
          .eq('subdomain', subdomain)
          .eq('status', 'active')
          .single();

        if (subdomainTenant) {
          return {
            id: subdomainTenant.id,
            name: subdomainTenant.name,
            slug: subdomainTenant.slug,
            type: subdomainTenant.type,
            branding: subdomainTenant.tenant_branding?.[0] || {}
          };
        }
      }

      // Fallback to default tenant
      return this.cachedDefaultTenant;
    } catch (error) {
      console.error('Error detecting tenant:', error);
      return this.cachedDefaultTenant;
    }
  }

  async loadDefaultTenant(): Promise<TenantData | null> {
    try {
      const { data: defaultTenant } = await supabase
        .from('tenants')
        .select(`
          id,
          name,
          slug,
          type,
          is_default,
          tenant_branding (
            logo_url,
            app_name,
            app_tagline,
            primary_color,
            secondary_color,
            background_color
          )
        `)
        .eq('is_default', true)
        .eq('status', 'active')
        .single();

      if (defaultTenant) {
        this.cachedDefaultTenant = {
          id: defaultTenant.id,
          name: defaultTenant.name,
          slug: defaultTenant.slug,
          type: defaultTenant.type,
          is_default: true,
          branding: defaultTenant.tenant_branding?.[0] || {}
        };
        
        this.defaultTenantId = defaultTenant.id;
        
        // Store in localStorage for offline access
        localStorage.setItem('defaultTenantId', this.defaultTenantId);
        localStorage.setItem('defaultTenantData', JSON.stringify(this.cachedDefaultTenant));
        
        return this.cachedDefaultTenant;
      }

      // Fallback: load from localStorage if available
      const cachedId = localStorage.getItem('defaultTenantId');
      const cachedData = localStorage.getItem('defaultTenantData');
      
      if (cachedId && cachedData) {
        this.defaultTenantId = cachedId;
        this.cachedDefaultTenant = JSON.parse(cachedData);
        return this.cachedDefaultTenant;
      }

      return null;
    } catch (error) {
      console.error('Error loading default tenant:', error);
      
      // Try to load from cache
      const cachedId = localStorage.getItem('defaultTenantId');
      const cachedData = localStorage.getItem('defaultTenantData');
      
      if (cachedId && cachedData) {
        this.defaultTenantId = cachedId;
        this.cachedDefaultTenant = JSON.parse(cachedData);
        return this.cachedDefaultTenant;
      }
      
      return null;
    }
  }

  getDefaultTenantId(): string | null {
    return this.defaultTenantId || localStorage.getItem('defaultTenantId');
  }

  async preCacheBranding(tenantId: string): Promise<void> {
    try {
      const { data: branding } = await supabase
        .from('tenant_branding')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      if (branding) {
        localStorage.setItem(`tenant_branding_${tenantId}`, JSON.stringify(branding));
      }
    } catch (error) {
      console.error('Error pre-caching branding:', error);
    }
  }

  getCachedBranding(tenantId: string): TenantBranding | null {
    try {
      const cached = localStorage.getItem(`tenant_branding_${tenantId}`);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }
}
