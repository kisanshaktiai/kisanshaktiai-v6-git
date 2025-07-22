
import { ApiClient, API_CONFIG } from './ApiClient';
import type { ApiResponse } from './ApiClient';

interface LoginRequest {
  mobile_number: string;
  pin: string;
  tenant_id?: string;
}

interface RegisterRequest {
  mobile_number: string;
  pin: string;
  farmer_data?: {
    name?: string;
    village?: string;
    district?: string;
    state?: string;
  };
  tenant_id?: string;
}

interface AuthResponse {
  token: string;
  farmer: {
    id: string;
    farmer_code: string;
    mobile_number: string;
    tenant_id: string;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
}

class AuthApiService {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = new ApiClient({ baseUrl: API_CONFIG.baseUrl });
  }

  async login(request: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    return this.apiClient.post<AuthResponse>('/api/auth/login', request);
  }

  async register(request: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    return this.apiClient.post<AuthResponse>('/api/auth/register', request);
  }

  async checkFarmerExists(mobileNumber: string): Promise<ApiResponse<{ exists: boolean }>> {
    return this.apiClient.get<{ exists: boolean }>(`/api/auth/check-farmer/${mobileNumber}`);
  }

  async refreshToken(token: string): Promise<ApiResponse<{ token: string }>> {
    this.apiClient.setAuthToken(token);
    return this.apiClient.post<{ token: string }>('/api/auth/refresh');
  }

  async logout(): Promise<ApiResponse<void>> {
    const response = await this.apiClient.post<void>('/api/auth/logout');
    this.apiClient.clearAuth();
    return response;
  }
}

export const authApiService = new AuthApiService();
export type { LoginRequest, RegisterRequest, AuthResponse };
