
import { supabase } from '@/integrations/supabase/client';
import { secureStorage } from './storage/secureStorage';

export interface AuthResponse {
  success: boolean;
  farmer?: any;
  user_profile?: any;
  token?: string;
  error?: string;
}

export interface Farmer {
  id: string;
  farmer_code: string;
  mobile_number: string;
  tenant_id: string;
}

export interface UserProfile {
  id: string;
  mobile_number: string;
  preferred_language: string;
  full_name?: string;
  farmer_id: string;
}

class CustomAuthService {
  private currentFarmer: Farmer | null = null;
  private currentUserProfile: UserProfile | null = null;
  private currentToken: string | null = null;

  async login(mobileNumber: string, pin: string): Promise<AuthResponse> {
    try {
      console.log('CustomAuthService: Attempting login for mobile:', mobileNumber);
      
      const { data, error } = await supabase.functions.invoke('custom-auth-login', {
        body: {
          mobile_number: mobileNumber,
          pin: pin
        }
      });

      if (error) {
        console.error('CustomAuthService: Login function error:', error);
        return {
          success: false,
          error: 'Authentication service error. Please try again.'
        };
      }

      if (!data || !data.success) {
        console.error('CustomAuthService: Login failed:', data?.error);
        return {
          success: false,
          error: data?.error || 'Login failed'
        };
      }

      console.log('CustomAuthService: Login successful:', data);

      // Store the authentication data
      this.currentFarmer = data.farmer;
      this.currentUserProfile = data.user_profile;
      this.currentToken = data.token;

      // Persist to secure storage
      await this.persistAuthData();

      return {
        success: true,
        farmer: data.farmer,
        user_profile: data.user_profile,
        token: data.token
      };
    } catch (error) {
      console.error('CustomAuthService: Login error:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.'
      };
    }
  }

  async register(mobileNumber: string, pin: string, farmerData: any = {}): Promise<AuthResponse> {
    try {
      console.log('CustomAuthService: Attempting registration for mobile:', mobileNumber);
      
      const { data, error } = await supabase.functions.invoke('custom-auth-register', {
        body: {
          mobile_number: mobileNumber,
          pin: pin,
          farmer_data: farmerData
        }
      });

      if (error) {
        console.error('CustomAuthService: Registration function error:', error);
        return {
          success: false,
          error: 'Registration service error. Please try again.'
        };
      }

      if (!data || !data.success) {
        console.error('CustomAuthService: Registration failed:', data?.error);
        return {
          success: false,
          error: data?.error || 'Registration failed'
        };
      }

      console.log('CustomAuthService: Registration successful:', data);

      // Store the authentication data
      this.currentFarmer = data.farmer;
      this.currentUserProfile = data.user_profile;
      this.currentToken = data.token;

      // Persist to secure storage
      await this.persistAuthData();

      return {
        success: true,
        farmer: data.farmer,
        user_profile: data.user_profile,
        token: data.token
      };
    } catch (error) {
      console.error('CustomAuthService: Registration error:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.'
      };
    }
  }

  async checkExistingFarmer(mobileNumber: string): Promise<boolean> {
    try {
      console.log('CustomAuthService: Checking existing farmer for mobile:', mobileNumber);
      
      const cleanMobile = mobileNumber.replace(/\D/g, '');
      
      // Use a simple query to check if farmer exists
      const { data, error } = await supabase
        .from('farmers')
        .select('id')
        .eq('mobile_number', cleanMobile)
        .limit(1);

      if (error) {
        console.error('CustomAuthService: Error checking farmer:', error);
        return false;
      }

      const exists = data && data.length > 0;
      console.log('CustomAuthService: Farmer exists check result:', exists);
      return exists;
    } catch (error) {
      console.error('CustomAuthService: Check existing farmer error:', error);
      return false;
    }
  }

  async signOut(): Promise<void> {
    try {
      console.log('CustomAuthService: Signing out');
      
      // Clear in-memory data
      this.currentFarmer = null;
      this.currentUserProfile = null;
      this.currentToken = null;

      // Clear persistent storage
      await secureStorage.removeItem('auth_farmer');
      await secureStorage.removeItem('auth_user_profile');
      await secureStorage.removeItem('auth_token');
      
      console.log('CustomAuthService: Sign out completed');
    } catch (error) {
      console.error('CustomAuthService: Sign out error:', error);
      throw error;
    }
  }

  async restoreSession(): Promise<boolean> {
    try {
      console.log('CustomAuthService: Attempting to restore session');
      
      const [farmerData, userProfileData, tokenData] = await Promise.all([
        secureStorage.getItem('auth_farmer'),
        secureStorage.getItem('auth_user_profile'),
        secureStorage.getItem('auth_token')
      ]);

      if (farmerData && tokenData) {
        this.currentFarmer = JSON.parse(farmerData);
        this.currentUserProfile = userProfileData ? JSON.parse(userProfileData) : null;
        this.currentToken = tokenData;
        
        console.log('CustomAuthService: Session restored successfully');
        return true;
      }

      console.log('CustomAuthService: No session to restore');
      return false;
    } catch (error) {
      console.error('CustomAuthService: Error restoring session:', error);
      return false;
    }
  }

  async refreshUserProfile(): Promise<void> {
    try {
      if (!this.currentFarmer) {
        console.log('CustomAuthService: No current farmer to refresh profile for');
        return;
      }

      console.log('CustomAuthService: Refreshing user profile');
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('farmer_id', this.currentFarmer.id)
        .single();

      if (error) {
        console.error('CustomAuthService: Error refreshing user profile:', error);
        return;
      }

      if (data) {
        this.currentUserProfile = data;
        await secureStorage.setItem('auth_user_profile', JSON.stringify(data));
        console.log('CustomAuthService: User profile refreshed');
      }
    } catch (error) {
      console.error('CustomAuthService: Refresh user profile error:', error);
    }
  }

  private async persistAuthData(): Promise<void> {
    try {
      console.log('CustomAuthService: Persisting auth data');
      
      const promises = [];
      
      if (this.currentFarmer) {
        promises.push(secureStorage.setItem('auth_farmer', JSON.stringify(this.currentFarmer)));
      }
      
      if (this.currentUserProfile) {
        promises.push(secureStorage.setItem('auth_user_profile', JSON.stringify(this.currentUserProfile)));
      }
      
      if (this.currentToken) {
        promises.push(secureStorage.setItem('auth_token', this.currentToken));
      }

      await Promise.all(promises);
      console.log('CustomAuthService: Auth data persisted successfully');
    } catch (error) {
      console.error('CustomAuthService: Error persisting auth data:', error);
      throw error;
    }
  }

  // Getters for current state
  getCurrentFarmer(): Farmer | null {
    return this.currentFarmer;
  }

  getCurrentUserProfile(): UserProfile | null {
    return this.currentUserProfile;
  }

  getCurrentToken(): string | null {
    return this.currentToken;
  }

  isAuthenticated(): boolean {
    return !!(this.currentFarmer && this.currentToken);
  }
}

export const customAuthService = new CustomAuthService();
