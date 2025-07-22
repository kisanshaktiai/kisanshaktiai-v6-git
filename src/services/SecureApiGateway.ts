
import { authApiService, type LoginRequest, type RegisterRequest } from './api/AuthApiService';
import { farmerApiService, type FarmerProfile } from './api/FarmerApiService';
import { secureStorage } from './storage/secureStorage';

// Simple tenant info type
interface TenantInfo {
  id: string;
  name: string;
  slug: string;
}

interface AuthState {
  isAuthenticated: boolean;
  farmer: FarmerProfile | null;
  tenant: TenantInfo | null;
  token: string | null;
}

class SecureApiGateway {
  private static instance: SecureApiGateway;
  private authState: AuthState = {
    isAuthenticated: false,
    farmer: null,
    tenant: null,
    token: null
  };

  static getInstance(): SecureApiGateway {
    if (!SecureApiGateway.instance) {
      SecureApiGateway.instance = new SecureApiGateway();
    }
    return SecureApiGateway.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Restore auth state from secure storage
      const token = await secureStorage.get('auth_token');
      const tenantId = await secureStorage.get('current_tenant_id');
      
      if (token && tenantId) {
        // Set auth context
        this.setAuthContext(token, tenantId);
        
        // Validate token and restore session
        const isValid = await this.validateSession();
        if (!isValid) {
          await this.clearSession();
        }
      }
    } catch (error) {
      console.error('Failed to initialize API Gateway:', error);
      await this.clearSession();
    }
  }

  private setAuthContext(token: string, tenantId: string): void {
    this.authState.token = token;
    
    // Set auth token for all API services
    farmerApiService.setAuthToken(token);
    
    // Set tenant context
    farmerApiService.setTenantContext(tenantId);
  }

  private async validateSession(): Promise<boolean> {
    try {
      if (!this.authState.token) return false;
      
      const response = await authApiService.refreshToken(this.authState.token);
      if (response.success && response.data) {
        this.authState.token = response.data.token;
        await secureStorage.set('auth_token', response.data.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  }

  async login(request: LoginRequest): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authApiService.login(request);
      
      if (response.success && response.data) {
        const { token, farmer, tenant } = response.data;
        
        // Store auth data securely
        await secureStorage.set('auth_token', token);
        await secureStorage.set('current_tenant_id', tenant.id);
        await secureStorage.setObject('farmer_profile', farmer);
        await secureStorage.setObject('tenant_info', tenant);
        
        // Update auth state
        this.authState = {
          isAuthenticated: true,
          farmer: farmer as any, // Type conversion needed
          tenant: tenant as any, // Type conversion needed
          token
        };
        
        // Set auth context for API services
        this.setAuthContext(token, tenant.id);
        
        return { success: true };
      }
      
      return { success: false, error: response.error || 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  async register(request: RegisterRequest): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authApiService.register(request);
      
      if (response.success && response.data) {
        const { token, farmer, tenant } = response.data;
        
        // Store auth data securely
        await secureStorage.set('auth_token', token);
        await secureStorage.set('current_tenant_id', tenant.id);
        await secureStorage.setObject('farmer_profile', farmer);
        await secureStorage.setObject('tenant_info', tenant);
        
        // Update auth state
        this.authState = {
          isAuthenticated: true,
          farmer: farmer as any,
          tenant: tenant as any,
          token
        };
        
        // Set auth context for API services
        this.setAuthContext(token, tenant.id);
        
        return { success: true };
      }
      
      return { success: false, error: response.error || 'Registration failed' };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.authState.token) {
        await authApiService.logout();
      }
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      await this.clearSession();
    }
  }

  private async clearSession(): Promise<void> {
    // Clear secure storage
    await secureStorage.remove('auth_token');
    await secureStorage.remove('current_tenant_id');
    await secureStorage.remove('farmer_profile');
    await secureStorage.remove('tenant_info');
    
    // Clear auth state
    this.authState = {
      isAuthenticated: false,
      farmer: null,
      tenant: null,
      token: null
    };
    
    // Clear API service contexts
    farmerApiService.setAuthToken('');
  }

  async checkFarmerExists(mobileNumber: string): Promise<boolean> {
    try {
      const response = await authApiService.checkFarmerExists(mobileNumber);
      return response.success && response.data?.exists || false;
    } catch (error) {
      console.error('Check farmer exists error:', error);
      return false;
    }
  }

  async getDefaultTenant(): Promise<TenantInfo | null> {
    try {
      // Return a default tenant for now
      return {
        id: 'default-tenant',
        name: 'KisanShakti AI',
        slug: 'default'
      };
    } catch (error) {
      console.error('Get default tenant error:', error);
      return null;
    }
  }

  // Getters for current state
  getAuthState(): AuthState {
    return { ...this.authState };
  }

  getCurrentFarmer(): FarmerProfile | null {
    return this.authState.farmer;
  }

  getCurrentTenant(): TenantInfo | null {
    return this.authState.tenant;
  }

  isAuthenticated(): boolean {
    return this.authState.isAuthenticated && !!this.authState.token;
  }

  // API Service Getters
  getFarmerApi() {
    return farmerApiService;
  }
}

export const secureApiGateway = SecureApiGateway.getInstance();
export type { AuthState };
