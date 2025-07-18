
import { supabase } from '@/integrations/supabase/client';

interface LoginResponse {
  success: boolean;
  token?: string;
  farmer?: {
    id: string;
    farmer_code: string;
    mobile_number: string;
    tenant_id: string | null;
  };
  error?: string;
}

interface RegisterResponse {
  success: boolean;
  token?: string;
  farmer?: {
    id: string;
    farmer_code: string;
    mobile_number: string;
    tenant_id: string | null;
  };
  error?: string;
}

export class CustomAuthService {
  private static instance: CustomAuthService;
  
  static getInstance(): CustomAuthService {
    if (!CustomAuthService.instance) {
      CustomAuthService.instance = new CustomAuthService();
    }
    return CustomAuthService.instance;
  }

  private getStorageKey(key: string): string {
    return `kisanshakti_${key}`;
  }

  async login(mobileNumber: string, pin: string): Promise<LoginResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('custom-auth-login', {
        body: {
          mobile_number: mobileNumber,
          pin: pin
        }
      });

      if (error) {
        throw new Error(error.message || 'Login failed');
      }

      if (data.success && data.token) {
        // Store token securely
        localStorage.setItem(this.getStorageKey('auth_token'), data.token);
        localStorage.setItem(this.getStorageKey('farmer_data'), JSON.stringify(data.farmer));
        
        // Set JWT in Supabase client for RLS
        supabase.auth.setSession({
          access_token: data.token,
          refresh_token: '',
          user: null,
          expires_at: Date.now() / 1000 + 24 * 60 * 60,
          expires_in: 24 * 60 * 60,
          token_type: 'bearer'
        } as any);
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  async register(mobileNumber: string, pin: string, farmerData?: any): Promise<RegisterResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('custom-auth-register', {
        body: {
          mobile_number: mobileNumber,
          pin: pin,
          farmer_data: farmerData || {}
        }
      });

      if (error) {
        throw new Error(error.message || 'Registration failed');
      }

      if (data.success && data.token) {
        // Store token securely
        localStorage.setItem(this.getStorageKey('auth_token'), data.token);
        localStorage.setItem(this.getStorageKey('farmer_data'), JSON.stringify(data.farmer));
        
        // Set JWT in Supabase client for RLS
        supabase.auth.setSession({
          access_token: data.token,
          refresh_token: '',
          user: null,
          expires_at: Date.now() / 1000 + 24 * 60 * 60,
          expires_in: 24 * 60 * 60,
          token_type: 'bearer'
        } as any);
      }

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  }

  async checkExistingFarmer(mobileNumber: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('farmers')
        .select('id')
        .eq('mobile_number', mobileNumber.replace(/\D/g, ''))
        .single();

      return !error && !!data;
    } catch (error) {
      console.error('Check existing farmer error:', error);
      return false;
    }
  }

  getCurrentFarmer(): any | null {
    try {
      const farmerData = localStorage.getItem(this.getStorageKey('farmer_data'));
      return farmerData ? JSON.parse(farmerData) : null;
    } catch (error) {
      console.error('Error getting current farmer:', error);
      return null;
    }
  }

  getCurrentToken(): string | null {
    return localStorage.getItem(this.getStorageKey('auth_token'));
  }

  isAuthenticated(): boolean {
    const token = this.getCurrentToken();
    const farmer = this.getCurrentFarmer();
    return !!(token && farmer);
  }

  async signOut(): Promise<void> {
    // Clear stored data
    localStorage.removeItem(this.getStorageKey('auth_token'));
    localStorage.removeItem(this.getStorageKey('farmer_data'));
    
    // Clear Supabase session
    await supabase.auth.signOut();
  }

  async restoreSession(): Promise<boolean> {
    try {
      const token = this.getCurrentToken();
      const farmer = this.getCurrentFarmer();

      if (token && farmer) {
        // Set JWT in Supabase client for RLS
        supabase.auth.setSession({
          access_token: token,
          refresh_token: '',
          user: null,
          expires_at: Date.now() / 1000 + 24 * 60 * 60,
          expires_in: 24 * 60 * 60,
          token_type: 'bearer'
        } as any);
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error restoring session:', error);
      return false;
    }
  }
}

export const customAuthService = CustomAuthService.getInstance();
