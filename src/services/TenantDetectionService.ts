
import { Preferences } from '@capacitor/preferences';
import { LocationService } from './LocationService';

interface DetectedTenant {
  id: string;
  name: string;
  slug: string;
  branding?: {
    logo_url?: string;
    app_name?: string;
    app_tagline?: string;
    primary_color?: string;
    background_color?: string;
  };
}

export class TenantDetectionService {
  private static instance: TenantDetectionService;
  
  static getInstance(): TenantDetectionService {
    if (!TenantDetectionService.instance) {
      TenantDetectionService.instance = new TenantDetectionService();
    }
    return TenantDetectionService.instance;
  }

  async detectTenant(): Promise<DetectedTenant | null> {
    try {
      // Check for cached tenant first
      const { value: cachedTenantId } = await Preferences.get({ key: 'currentTenantId' });
      if (cachedTenantId) {
        console.log('Using cached tenant:', cachedTenantId);
        return await this.getTenantById(cachedTenantId);
      }

      // Check for referral code in URL
      const urlParams = new URLSearchParams(window.location.search);
      const referralCode = urlParams.get('tenant') || urlParams.get('ref');
      if (referralCode) {
        console.log('Using referral tenant:', referralCode);
        const tenant = await this.getTenantBySlug(referralCode);
        if (tenant) {
          await this.cacheTenant(tenant.id);
          return tenant;
        }
      }

      // Try geo-location based detection
      try {
        const location = await LocationService.getInstance().getCurrentLocation();
        const address = await LocationService.getInstance().reverseGeocode(
          location.latitude,
          location.longitude
        );
        
        const tenant = await this.getTenantByLocation(address.state, address.district);
        if (tenant) {
          await this.cacheTenant(tenant.id);
          return tenant;
        }
      } catch (error) {
        console.log('Location-based tenant detection failed:', error);
      }

      // Fallback to default tenant
      return this.getDefaultTenant();

    } catch (error) {
      console.error('Tenant detection error:', error);
      return this.getDefaultTenant();
    }
  }

  private async getTenantById(tenantId: string): Promise<DetectedTenant | null> {
    // Mock implementation - replace with actual Supabase call
    const mockTenants = this.getMockTenants();
    return mockTenants.find(t => t.id === tenantId) || null;
  }

  private async getTenantBySlug(slug: string): Promise<DetectedTenant | null> {
    // Mock implementation - replace with actual Supabase call
    const mockTenants = this.getMockTenants();
    return mockTenants.find(t => t.slug === slug) || null;
  }

  private async getTenantByLocation(state: string, district: string): Promise<DetectedTenant | null> {
    // Mock geo-based tenant detection
    const locationMappings = {
      'Maharashtra': 'mahindra-agri',
      'Punjab': 'iffco',
      'Uttar Pradesh': 'government-up',
      'Karnataka': 'upl-agri',
      'Tamil Nadu': 'coromandel'
    };

    const tenantSlug = locationMappings[state];
    if (tenantSlug) {
      return await this.getTenantBySlug(tenantSlug);
    }

    return null;
  }

  private async cacheTenant(tenantId: string): Promise<void> {
    await Preferences.set({
      key: 'currentTenantId',
      value: tenantId
    });
  }

  private getDefaultTenant(): DetectedTenant {
    return {
      id: 'default',
      name: 'KisanShaktiAI',
      slug: 'default',
      branding: {
        logo_url: '/placeholder.svg',
        app_name: 'KisanShaktiAI V6',
        app_tagline: 'Empowering 10M+ farmers across India',
        primary_color: '#10B981',
        background_color: '#FFFFFF'
      }
    };
  }

  private getMockTenants(): DetectedTenant[] {
    return [
      {
        id: 'mahindra-agri',
        name: 'Mahindra Agriculture',
        slug: 'mahindra-agri',
        branding: {
          logo_url: '/placeholder.svg',
          app_name: 'Mahindra Krishi',
          app_tagline: 'Rise for Good Agriculture',
          primary_color: '#DC2626',
          background_color: '#FEF2F2'
        }
      },
      {
        id: 'iffco',
        name: 'IFFCO',
        slug: 'iffco',
        branding: {
          logo_url: '/placeholder.svg',
          app_name: 'IFFCO Kisan',
          app_tagline: 'Cooperative Success for Farmers',
          primary_color: '#059669',
          background_color: '#F0FDF4'
        }
      },
      {
        id: 'government-up',
        name: 'UP Government',
        slug: 'government-up',
        branding: {
          logo_url: '/placeholder.svg',
          app_name: 'UP Kisan Seva',
          app_tagline: 'Government of Uttar Pradesh',
          primary_color: '#7C3AED',
          background_color: '#FAF5FF'
        }
      }
    ];
  }
}
