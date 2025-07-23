
import { supabase } from '@/integrations/supabase/client';
import { secureStorage } from '@/services/storage/secureStorage';

interface Farmer {
  id: string;
  farmer_code: string;
  mobile_number: string;
  tenant_id: string;
}

interface UserProfile {
  id: string;
  mobile_number: string;
  preferred_language: string;
  full_name?: string;
  farmer_id: string;
}

interface AuthResponse {
  success: boolean;
  error?: string;
  token?: string;
  farmer?: Farmer;
  user_profile?: UserProfile;
}

class CustomAuthService {
  private static instance: CustomAuthService;
  private currentFarmer: Farmer | null = null;
  private currentUserProfile: UserProfile | null = null;
  private currentToken: string | null = null;

  static getInstance(): CustomAuthService {
    if (!CustomAuthService.instance) {
      CustomAuthService.instance = new CustomAuthService();
    }
    return CustomAuthService.instance;
  }

  async login(mobileNumber: string, pin: string): Promise<AuthResponse> {
    try {
      console.log('CustomAuthService: Attempting login for:', mobileNumber);

      const { data, error } = await supabase.functions.invoke('custom-auth-login', {
        body: {
          mobile_number: mobileNumber,
          pin: pin
        }
      });

      if (error) {
        console.error('CustomAuthService: Login error:', error);
        return {
          success: false,
          error: error.message || 'Login failed'
        };
      }

      if (!data.success) {
        console.error('CustomAuthService: Login failed:', data.error);
        return {
          success: false,
          error: data.error || 'Login failed'
        };
      }

      console.log('CustomAuthService: Login successful:', data);

      // Store session data
      this.currentFarmer = data.farmer;
      this.currentUserProfile = data.user_profile;
      this.currentToken = data.token;

      // Cache in secure storage
      await secureStorage.setItem('auth_token', data.token);
      await secureStorage.setItem('current_farmer', JSON.stringify(data.farmer));
      if (data.user_profile) {
        await secureStorage.setItem('current_user_profile', JSON.stringify(data.user_profile));
      }

      return {
        success: true,
        token: data.token,
        farmer: data.farmer,
        user_profile: data.user_profile
      };

    } catch (error) {
      console.error('CustomAuthService: Login network error:', error);
      return {
        success: false,
        error: 'Network error during login'
      };
    }
  }

  async register(mobileNumber: string, pin: string, farmerData?: any): Promise<AuthResponse> {
    try {
      console.log('CustomAuthService: Attempting registration for:', mobileNumber);

      const { data, error } = await supabase.functions.invoke('custom-auth-register', {
        body: {
          mobile_number: mobileNumber,
          pin: pin,
          full_name: farmerData?.full_name
        }
      });

      if (error) {
        console.error('CustomAuthService: Registration error:', error);
        return {
          success: false,
          error: error.message || 'Registration failed'
        };
      }

      if (!data.success) {
        console.error('CustomAuthService: Registration failed:', data.error);
        return {
          success: false,
          error: data.error || 'Registration failed'
        };
      }

      console.log('CustomAuthService: Registration successful:', data);

      // Store session data (registration doesn't return token, so we'll need to login)
      this.currentFarmer = data.farmer;
      this.currentUserProfile = data.user_profile;

      // Cache farmer data
      await secureStorage.setItem('current_farmer', JSON.stringify(data.farmer));
      if (data.user_profile) {
        await secureStorage.setItem('current_user_profile', JSON.stringify(data.user_profile));
      }

      return {
        success: true,
        farmer: data.farmer,
        user_profile: data.user_profile
      };

    } catch (error) {
      console.error('CustomAuthService: Registration network error:', error);
      return {
        success: false,
        error: 'Network error during registration'
      };
    }
  }

  async checkExistingFarmer(mobileNumber: string): Promise<boolean> {
    try {
      console.log('CustomAuthService: Checking existing farmer for:', mobileNumber);

      const { data, error } = await supabase.functions.invoke('mobile-auth-check', {
        body: {
          mobile_number: mobileNumber
        }
      });

      if (error) {
        console.error('CustomAuthService: Check farmer error:', error);
        return false;
      }

      return data?.exists || false;

    } catch (error) {
      console.error('CustomAuthService: Network error checking farmer:', error);
      return false;
    }
  }

  async restoreSession(): Promise<boolean> {
    try {
      console.log('CustomAuthService: Restoring session');

      const [token, farmerData, profileData] = await Promise.all([
        secureStorage.getItem('auth_token'),
        secureStorage.getItem('current_farmer'),
        secureStorage.getItem('current_user_profile')
      ]);

      if (token && farmerData) {
        this.currentToken = token;
        this.currentFarmer = JSON.parse(farmerData);
        
        if (profileData) {
          this.currentUserProfile = JSON.parse(profileData);
        }

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
    if (!this.currentFarmer) return;

    try {
      console.log('CustomAuthService: Refreshing user profile');
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('farmer_id', this.currentFarmer.id)
        .maybeSingle();

      if (!error && data) {
        this.currentUserProfile = {
          id: data.id,
          mobile_number: data.mobile_number,
          preferred_language: data.preferred_language,
          full_name: data.full_name,
          farmer_id: data.farmer_id
        };

        await secureStorage.setItem('current_user_profile', JSON.stringify(this.currentUserProfile));
        console.log('CustomAuthService: User profile refreshed');
      }

    } catch (error) {
      console.error('CustomAuthService: Error refreshing user profile:', error);
    }
  }

  async signOut(): Promise<void> {
    try {
      console.log('CustomAuthService: Signing out');

      // Clear memory
      this.currentFarmer = null;
      this.currentUserProfile = null;
      this.currentToken = null;

      // Clear storage
      await Promise.all([
        secureStorage.removeItem('auth_token'),
        secureStorage.removeItem('current_farmer'),
        secureStorage.removeItem('current_user_profile')
      ]);

      console.log('CustomAuthService: Sign out successful');

    } catch (error) {
      console.error('CustomAuthService: Error during sign out:', error);
    }
  }

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
    return !!this.currentFarmer && !!this.currentToken;
  }
}

export const customAuthService = CustomAuthService.getInstance();
