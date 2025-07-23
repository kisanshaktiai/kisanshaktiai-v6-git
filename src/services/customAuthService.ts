
import { supabase } from '@/integrations/supabase/client';
import { secureStorage } from '@/services/storage/secureStorage';
import { DEFAULT_TENANT_ID } from '@/config/constants';

interface AuthResponse {
  success: boolean;
  farmer?: any;
  user_profile?: any;
  error?: string;
  userId?: string;
  token?: string;
}

class CustomAuthService {
  private static instance: CustomAuthService;
  private currentFarmer: any = null;
  private currentToken: string | null = null;
  private currentUserProfile: any = null;

  static getInstance(): CustomAuthService {
    if (!CustomAuthService.instance) {
      CustomAuthService.instance = new CustomAuthService();
    }
    return CustomAuthService.instance;
  }

  async register(mobileNumber: string, pin: string, farmerData: any = {}): Promise<AuthResponse> {
    try {
      // Clean mobile number (remove any non-digits)
      const cleanMobile = mobileNumber.replace(/\D/g, '');
      
      console.log('Registering farmer with mobile:', cleanMobile);
      
      // Enhanced registration with better error handling
      const { data, error } = await supabase.functions.invoke('custom-auth-register', {
        body: {
          mobile_number: cleanMobile,
          pin,
          farmer_data: {
            ...farmerData,
            tenant_id: farmerData.tenant_id || DEFAULT_TENANT_ID
          }
        }
      });

      if (error) {
        console.error('Registration error:', error);
        return { 
          success: false, 
          error: error.message || 'Registration failed' 
        };
      }

      if (!data.success) {
        console.error('Registration failed:', data.error);
        return { 
          success: false, 
          error: data.error || 'Registration failed' 
        };
      }

      console.log('Registration successful:', data);

      // Store authentication data
      this.currentFarmer = data.farmer;
      this.currentToken = data.token;
      this.currentUserProfile = data.user_profile;
      
      // Save to secure storage with enhanced data
      await secureStorage.setItem('farmer_auth', JSON.stringify({
        farmer: data.farmer,
        token: data.token,
        user_profile: data.user_profile,
        registered_at: new Date().toISOString()
      }));

      return { 
        success: true, 
        farmer: data.farmer,
        user_profile: data.user_profile,
        userId: data.farmer.id,
        token: data.token
      };
    } catch (error) {
      console.error('Registration process error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Registration failed' 
      };
    }
  }

  async login(mobileNumber: string, pin: string): Promise<AuthResponse> {
    try {
      // Clean mobile number (remove any non-digits)
      const cleanMobile = mobileNumber.replace(/\D/g, '');
      
      console.log('Logging in farmer with mobile:', cleanMobile);
      
      // Enhanced login with better error handling
      const { data, error } = await supabase.functions.invoke('custom-auth-login', {
        body: {
          mobile_number: cleanMobile,
          pin
        }
      });

      if (error) {
        console.error('Login error:', error);
        return { 
          success: false, 
          error: error.message || 'Login failed' 
        };
      }

      if (!data.success) {
        console.error('Login failed:', data.error);
        return { 
          success: false, 
          error: data.error || 'Login failed' 
        };
      }

      console.log('Login successful:', data);

      // Store authentication data
      this.currentFarmer = data.farmer;
      this.currentToken = data.token;
      this.currentUserProfile = data.user_profile;
      
      // Save to secure storage with enhanced data
      await secureStorage.setItem('farmer_auth', JSON.stringify({
        farmer: data.farmer,
        token: data.token,
        user_profile: data.user_profile,
        logged_in_at: new Date().toISOString()
      }));

      return { 
        success: true, 
        farmer: data.farmer,
        user_profile: data.user_profile,
        userId: data.farmer.id,
        token: data.token
      };
    } catch (error) {
      console.error('Login process error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      };
    }
  }

  async checkExistingFarmer(mobileNumber: string): Promise<boolean> {
    try {
      const cleanMobile = mobileNumber.replace(/\D/g, '');
      
      console.log('Checking existing farmer with mobile:', cleanMobile);
      
      const { data, error } = await supabase
        .from('farmers')
        .select('id')
        .eq('mobile_number', cleanMobile)
        .maybeSingle();

      if (error) {
        console.error('Error checking farmer existence:', error);
        return false;
      }

      const exists = !!data;
      console.log('Farmer exists:', exists);
      return exists;
    } catch (error) {
      console.error('Error in checkExistingFarmer:', error);
      return false;
    }
  }

  async restoreSession(): Promise<boolean> {
    try {
      const storedAuth = await secureStorage.getItem('farmer_auth');
      
      if (!storedAuth) {
        console.log('No stored authentication found');
        return false;
      }

      const { farmer, token, user_profile } = JSON.parse(storedAuth);
      
      if (!farmer || !token) {
        console.log('Invalid stored authentication data');
        return false;
      }

      console.log('Restoring session for farmer:', farmer.id);

      // Validate token
      if (token.startsWith('offline_')) {
        // Offline token, just restore session
        this.currentFarmer = farmer;
        this.currentToken = token;
        this.currentUserProfile = user_profile;
        return true;
      } else {
        // Online token, restore session
        this.currentFarmer = farmer;
        this.currentToken = token;
        this.currentUserProfile = user_profile;
        return true;
      }
    } catch (error) {
      console.error('Error restoring session:', error);
      return false;
    }
  }

  async signOut(): Promise<void> {
    console.log('Signing out farmer');
    this.currentFarmer = null;
    this.currentToken = null;
    this.currentUserProfile = null;
    await secureStorage.removeItem('farmer_auth');
  }

  getCurrentFarmer(): any {
    return this.currentFarmer;
  }

  getCurrentToken(): string | null {
    return this.currentToken;
  }

  getCurrentUserProfile(): any {
    return this.currentUserProfile;
  }

  isAuthenticated(): boolean {
    return !!this.currentFarmer && !!this.currentToken;
  }

  // Enhanced method to get complete user data
  getCurrentUserData(): { farmer: any; userProfile: any; token: string | null } {
    return {
      farmer: this.currentFarmer,
      userProfile: this.currentUserProfile,
      token: this.currentToken
    };
  }

  // Method to refresh user profile data
  async refreshUserProfile(): Promise<void> {
    if (!this.currentFarmer) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', this.currentFarmer.id)
        .maybeSingle();

      if (!error && data) {
        this.currentUserProfile = data;
        
        // Update stored data
        const storedAuth = await secureStorage.getItem('farmer_auth');
        if (storedAuth) {
          const authData = JSON.parse(storedAuth);
          authData.user_profile = data;
          await secureStorage.setItem('farmer_auth', JSON.stringify(authData));
        }
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  }
}

export const customAuthService = CustomAuthService.getInstance();
