
import { ApiClient, API_CONFIG } from './ApiClient';
import type { ApiResponse } from './ApiClient';

interface TenantBranding {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  app_name: string;
  app_tagline: string;
  logo_url: string;
  splash_screen_url?: string;
}

interface TenantFeatures {
  ai_chat: boolean;
  weather_forecast: boolean;
  marketplace: boolean;
  community_forum: boolean;
  satellite_imagery: boolean;
  soil_testing: boolean;
  basic_analytics: boolean;
}

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  subscription_plan: string;
  branding: TenantBranding;
  features: TenantFeatures;
}

class TenantApiService {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = new ApiClient({ baseUrl: API_CONFIG.baseUrl });
  }

  async getTenantBranding(tenantId: string): Promise<ApiResponse<TenantBranding>> {
    return this.apiClient.get<TenantBranding>(`/api/branding/${tenantId}`);
  }

  async getTenantFeatures(tenantId: string): Promise<ApiResponse<TenantFeatures>> {
    return this.apiClient.get<TenantFeatures>(`/api/features/${tenantId}`);
  }

  async getTenantInfo(tenantId: string): Promise<ApiResponse<TenantInfo>> {
    return this.apiClient.get<TenantInfo>(`/api/tenant/${tenantId}`);
  }

  async detectTenantByDomain(domain: string): Promise<ApiResponse<{ tenant_id: string }>> {
    return this.apiClient.get<{ tenant_id: string }>(`/api/tenant/detect?domain=${domain}`);
  }

  async getTenantBySlug(slug: string): Promise<ApiResponse<TenantInfo>> {
    return this.apiClient.get<TenantInfo>(`/api/tenant/slug/${slug}`);
  }

  setTenantContext(tenantId: string): void {
    this.apiClient.setTenantId(tenantId);
  }

  setAuthToken(token: string): void {
    this.apiClient.setAuthToken(token);
  }
}

export const tenantApiService = new TenantApiService();
export type { TenantBranding, TenantFeatures, TenantInfo };
