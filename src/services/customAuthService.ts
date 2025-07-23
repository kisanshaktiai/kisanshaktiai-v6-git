
import { supabase } from '@/integrations/supabase/client';
import { secureStorage } from './storage/secureStorage';
import { STORAGE_KEYS } from '@/config/constants';

interface LoginResponse {
  success: boolean;
  error?: string;
  farmer?: any;
  user_profile?: any;
  token?: string;
}

interface RegistrationResponse {
  success: boolean;
  error?: string;
  farmer?: any;
  user_profile?: any;
  token?: string;
}

// Cache for tenant data to avoid repeated API calls
let cachedDefaultTenant: any = null;
let tenantCacheTimestamp = 0;
const TENANT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

class CustomAuthService {
  private currentFarmer: any = null;
  private currentUserProfile: any = null;
  private currentToken: string | null = null;

  async getDefaultTenant() {
    const now = Date.now();
    
    // Return cached tenant if still valid
    if (cachedDefaultTenant && (now - tenantCacheTimestamp) < TENANT_CACHE_DURATION) {
      console.log('CustomAuthService: Using cached default tenant');
      return cachedDefaultTenant;
    }

    try {
      console.log('CustomAuthService: Fetching default tenant from API');
      
      const { data, error } = await supabase.functions.invoke('tenant-default', {
        method: 'GET'
      });

      if (error) {
        console.error('CustomAuthService: Error fetching default tenant:', error);
        // Return cached tenant as fallback if available
        if (cachedDefaultTenant) {
          console.log('CustomAuthService: Using cached tenant as fallback');
          return cachedDefaultTenant;
        }
        throw error;
      }

      if (data) {
        console.log('CustomAuthService: Default tenant fetched successfully:', data);
        cachedDefaultTenant = data;
        tenantCacheTimestamp = now;
        return data;
      }

      throw new Error('No default tenant data received');
    } catch (error) {
      console.error('CustomAuthService: Failed to fetch default tenant:', error);
      
      // Try to get cached tenant from storage as last resort
      try {
        const cached = await secureStorage.getItem('cached_default_tenant');
        if (cached) {
          const parsedCached = JSON.parse(cached);
          console.log('CustomAuthService: Using stored cached tenant as fallback');
          cachedDefaultTenant = parsedCached;
          return parsedCached;
        }
      } catch (storageError) {
        console.error('CustomAuthService: Failed to get cached tenant from storage:', storageError);
      }
      
      throw error;
    }
  }

  async register(mobileNumber: string, pin: string, farmerData: any = {}): Promise<RegistrationResponse> {
    try {
      console.log('CustomAuthService: Starting registration process');
      
      // Get default tenant first
      const defaultTenant = await this.getDefaultTenant();
      if (!defaultTenant) {
        throw new Error('Unable to get default tenant configuration');
      }

      const requestData = {
        mobile_number: mobileNumber,
        pin: pin,
        farmer_data: {
          ...farmerData,
          tenant_id: defaultTenant.id
        }
      };

      console.log('CustomAuthService: Calling custom-auth-register function');
      const { data, error } = await supabase.functions.invoke('custom-auth-register', {
        body: requestData
      });

      if (error) {
        console.error('CustomAuthService: Registration function error:', error);
        return {
          success: false,
          error: error.message || 'Registration failed'
        };
      }

      if (data?.success) {
        console.log('CustomAuthService: Registration successful');
        
        // Store authentication data
        if (data.farmer) {
          this.currentFarmer = data.farmer;
          await secureStorage.setItem(STORAGE_KEYS.FARMER_DATA, JSON.stringify(data.farmer));
        }

        if (data.user_profile) {
          this.currentUserProfile = data.user_profile;
          await secureStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(data.user_profile));
        }

        if (data.token) {
          this.currentToken = data.token;
          await secureStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
        }

        console.log('CustomAuthService: Registration data stored successfully');
        return data;
      } else {
        console.error('CustomAuthService: Registration failed:', data?.error);
        return {
          success: false,
          error: data?.error || 'Registration failed'
        };
      }
    } catch (error) {
      console.error('CustomAuthService: Registration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  }

  async login(mobileNumber: string, pin: string): Promise<LoginResponse> {
    try {
      console.log('CustomAuthService: Starting login process');
      
      // Get default tenant first
      const defaultTenant = await this.getDefaultTenant();
      if (!defaultTenant) {
        throw new Error('Unable to get default tenant configuration');
      }

      const requestData = {
        mobile_number: mobileNumber,
        pin: pin
      };

      console.log('CustomAuthService: Calling custom-auth-login function');
      const { data, error } = await supabase.functions.invoke('custom-auth-login', {
        body: requestData
      });

      if (error) {
        console.error('CustomAuthService: Login function error:', error);
        return {
          success: false,
          error: error.message || 'Login failed'
        };
      }

      if (data?.success) {
        console.log('CustomAuthService: Login successful');
        
        // Store authentication data
        if (data.farmer) {
          this.currentFarmer = data.farmer;
          await secureStorage.setItem(STORAGE_KEYS.FARMER_DATA, JSON.stringify(data.farmer));
        }

        if (data.user_profile) {
          this.currentUserProfile = data.user_profile;
          await secureStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(data.user_profile));
        }

        if (data.token) {
          this.currentToken = data.token;
          await secureStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
        }

        console.log('CustomAuthService: Login data stored successfully');
        return data;
      } else {
        console.error('CustomAuthService: Login failed:', data?.error);
        return {
          success: false,
          error: data?.error || 'Login failed'
        };
      }
    } catch (error) {
      console.error('CustomAuthService: Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  async checkExistingFarmer(mobileNumber: string): Promise<boolean> {
    try {
      console.log('CustomAuthService: Checking existing farmer');
      
      // Get default tenant first
      const defaultTenant = await this.getDefaultTenant();
      if (!defaultTenant) {
        console.warn('CustomAuthService: No default tenant available for farmer check');
        return false;
      }

      const cleanMobile = mobileNumber.replace(/\D/g, '');
      
      const { data, error } = await supabase
        .from('farmers')
        .select('id')
        .eq('mobile_number', cleanMobile)
        .eq('tenant_id', defaultTenant.id)
        .maybeSingle();

      if (error) {
        console.error('CustomAuthService: Error checking existing farmer:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('CustomAuthService: Check existing farmer error:', error);
      return false;
    }
  }

  async restoreSession(): Promise<boolean> {
    try {
      console.log('CustomAuthService: Restoring session from storage');
      
      const [farmerData, userProfileData, token] = await Promise.all([
        secureStorage.getItem(STORAGE_KEYS.FARMER_DATA),
        secureStorage.getItem(STORAGE_KEYS.USER_PROFILE),
        secureStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
      ]);

      if (farmerData) {
        this.currentFarmer = JSON.parse(farmerData);
        console.log('CustomAuthService: Farmer data restored');
      }

      if (userProfileData) {
        this.currentUserProfile = JSON.parse(userProfileData);
        console.log('CustomAuthService: User profile data restored');
      }

      if (token) {
        this.currentToken = token;
        console.log('CustomAuthService: Auth token restored');
      }

      const hasSession = !!(this.currentFarmer && this.currentToken);
      console.log('CustomAuthService: Session restoration result:', hasSession);
      
      return hasSession;
    } catch (error) {
      console.error('CustomAuthService: Session restoration error:', error);
      return false;
    }
  }

  async refreshUserProfile(): Promise<void> {
    try {
      if (!this.currentFarmer) {
        console.warn('CustomAuthService: No current farmer for profile refresh');
        return;
      }

      console.log('CustomAuthService: Refreshing user profile');
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', this.currentFarmer.id)
        .maybeSingle();

      if (error) {
        console.error('CustomAuthService: Error refreshing user profile:', error);
        return;
      }

      if (data) {
        this.currentUserProfile = data;
        await secureStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(data));
        console.log('CustomAuthService: User profile refreshed successfully');
      }
    } catch (error) {
      console.error('CustomAuthService: Profile refresh error:', error);
    }
  }

  async signOut(): Promise<void> {
    try {
      console.log('CustomAuthService: Signing out');
      
      // Clear in-memory data
      this.currentFarmer = null;
      this.currentUserProfile = null;
      this.currentToken = null;
      
      // Clear stored data
      await Promise.all([
        secureStorage.removeItem(STORAGE_KEYS.FARMER_DATA),
        secureStorage.removeItem(STORAGE_KEYS.USER_PROFILE),
        secureStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
      ]);
      
      console.log('CustomAuthService: Sign out completed');
    } catch (error) {
      console.error('CustomAuthService: Sign out error:', error);
    }
  }

  getCurrentFarmer() {
    return this.currentFarmer;
  }

  getCurrentUserProfile() {
    return this.currentUserProfile;
  }

  getCurrentToken() {
    return this.currentToken;
  }

  isAuthenticated(): boolean {
    return !!(this.currentFarmer && this.currentToken);
  }
}

export const customAuthService = new CustomAuthService();
