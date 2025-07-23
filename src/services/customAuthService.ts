
import { supabase } from '@/integrations/supabase/client';
import { secureStorage } from '@/services/storage/secureStorage';
import { DEFAULT_TENANT_ID } from '@/config/constants';

interface AuthResponse {
  success: boolean;
  farmer?: any;
  profile?: any;
  error?: string;
  userId?: string;
  token?: string;
}

class CustomAuthService {
  private static instance: CustomAuthService;
  private currentFarmer: any = null;
  private currentProfile: any = null;
  private currentToken: string | null = null;

  static getInstance(): CustomAuthService {
    if (!CustomAuthService.instance) {
      CustomAuthService.instance = new CustomAuthService();
    }
    return CustomAuthService.instance;
  }

  async checkExistingUser(mobileNumber: string): Promise<{ exists: boolean; farmer?: any; profile?: any }> {
    try {
      const cleanMobile = mobileNumber.replace(/\D/g, '');
      
      console.log('Checking existing user with mobile:', cleanMobile);
      
      const { data, error } = await supabase.functions.invoke('check-user-exists', {
        body: { mobile_number: cleanMobile }
      });

      if (error) {
        console.error('Error checking user existence:', error);
        return { exists: false };
      }

      return {
        exists: data.exists,
        farmer: data.farmer,
        profile: data.profile
      };
    } catch (error) {
      console.error('Error in checkExistingUser:', error);
      return { exists: false };
    }
  }

  async register(mobileNumber: string, pin: string, farmerData: any = {}): Promise<AuthResponse> {
    try {
      const cleanMobile = mobileNumber.replace(/\D/g, '');
      
      console.log('Registering farmer with mobile:', cleanMobile);
      
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

      // Store authentication data
      this.currentFarmer = data.farmer;
      this.currentToken = data.token;
      
      // Fetch profile data
      await this.fetchProfile(cleanMobile);
      
      // Save to secure storage
      await secureStorage.setItem('farmer_auth', JSON.stringify({
        farmer: data.farmer,
        profile: this.currentProfile,
        token: data.token
      }));

      return { 
        success: true, 
        farmer: data.farmer,
        profile: this.currentProfile,
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
      const cleanMobile = mobileNumber.replace(/\D/g, '');
      
      console.log('Logging in farmer with mobile:', cleanMobile);
      
      // Check if farmer exists first
      const { exists, farmer: existingFarmer } = await this.checkExistingUser(cleanMobile);

      if (!exists || !existingFarmer) {
        return { 
          success: false, 
          error: 'Farmer not found with this mobile number' 
        };
      }

      // Invoke the authentication edge function
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
        return { 
          success: false, 
          error: data.error || 'Login failed' 
        };
      }

      // Store authentication data
      this.currentFarmer = data.farmer;
      this.currentToken = data.token;
      
      // Fetch profile data
      await this.fetchProfile(cleanMobile);
      
      // Save to secure storage
      await secureStorage.setItem('farmer_auth', JSON.stringify({
        farmer: data.farmer,
        profile: this.currentProfile,
        token: data.token
      }));

      return { 
        success: true, 
        farmer: data.farmer,
        profile: this.currentProfile,
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

  private async fetchProfile(mobileNumber: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('mobile_number', mobileNumber)
        .maybeSingle();

      if (!error && data) {
        this.currentProfile = data;
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }

  async updateProfile(profileData: any): Promise<AuthResponse> {
    try {
      if (!this.currentFarmer) {
        return { success: false, error: 'No authenticated farmer found' };
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .eq('mobile_number', this.currentFarmer.mobile_number)
        .select()
        .single();

      if (error) {
        console.error('Profile update error:', error);
        return { success: false, error: 'Failed to update profile' };
      }

      this.currentProfile = data;
      
      // Update stored data
      await secureStorage.setItem('farmer_auth', JSON.stringify({
        farmer: this.currentFarmer,
        profile: this.currentProfile,
        token: this.currentToken
      }));

      return { success: true, profile: data };
    } catch (error) {
      console.error('Profile update process error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Profile update failed' 
      };
    }
  }

  async restoreSession(): Promise<boolean> {
    try {
      const storedAuth = await secureStorage.getItem('farmer_auth');
      
      if (!storedAuth) {
        return false;
      }

      const { farmer, profile, token } = JSON.parse(storedAuth);
      
      if (!farmer || !token) {
        return false;
      }

      this.currentFarmer = farmer;
      this.currentProfile = profile;
      this.currentToken = token;
      
      return true;
    } catch (error) {
      console.error('Error restoring session:', error);
      return false;
    }
  }

  async signOut(): Promise<void> {
    this.currentFarmer = null;
    this.currentProfile = null;
    this.currentToken = null;
    await secureStorage.removeItem('farmer_auth');
  }

  getCurrentFarmer(): any {
    return this.currentFarmer;
  }

  getCurrentProfile(): any {
    return this.currentProfile;
  }

  getCurrentToken(): string | null {
    return this.currentToken;
  }

  isAuthenticated(): boolean {
    return !!this.currentFarmer && !!this.currentToken;
  }

  // Legacy method for backward compatibility
  async checkExistingFarmer(mobileNumber: string): Promise<boolean> {
    const result = await this.checkExistingUser(mobileNumber);
    return result.exists;
  }
}

export const customAuthService = CustomAuthService.getInstance();
