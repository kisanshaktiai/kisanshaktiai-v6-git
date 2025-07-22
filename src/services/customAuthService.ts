
import { supabase } from '@/integrations/supabase/client';
import { secureStorage } from '@/services/storage/secureStorage';
import { DEFAULT_TENANT_ID } from '@/config/constants';

interface AuthResponse {
  success: boolean;
  farmer?: any;
  error?: string;
  userId?: string;
  token?: string;
}

class CustomAuthService {
  private static instance: CustomAuthService;
  private currentFarmer: any = null;
  private currentToken: string | null = null;

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
      
      // Use the edge function to register the farmer
      const { data, error } = await supabase.functions.invoke('custom-auth-register', {
        body: {
          mobile_number: cleanMobile,
          pin,
          farmer_data: {
            ...farmerData,
            // Make sure tenant_id is set (default if not provided)
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
        return { 
          success: false, 
          error: data.error || 'Registration failed' 
        };
      }

      // Store authentication data
      this.currentFarmer = data.farmer;
      this.currentToken = data.token;
      
      // Save to secure storage
      await secureStorage.setItem('farmer_auth', JSON.stringify({
        farmer: data.farmer,
        token: data.token
      }));

      // Create user profile entry
      try {
        // Check if user profile exists first
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('phone', cleanMobile)
          .maybeSingle();

        if (!existingProfile) {
          await supabase.from('user_profiles').insert({
            id: data.farmer.id,
            phone: cleanMobile,
            phone_verified: true,
            preferred_language: 'hi',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      } catch (profileError) {
        console.error('Error creating user profile:', profileError);
        // Don't fail registration if profile creation fails
      }

      return { 
        success: true, 
        farmer: data.farmer,
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
      
      // First check if the farmer exists
      const { data: existingFarmer } = await supabase
        .from('farmers')
        .select('id, mobile_number, farmer_code, tenant_id')
        .eq('mobile_number', cleanMobile)
        .maybeSingle();

      if (!existingFarmer) {
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
      
      // Save to secure storage
      await secureStorage.setItem('farmer_auth', JSON.stringify({
        farmer: data.farmer,
        token: data.token
      }));

      return { 
        success: true, 
        farmer: data.farmer,
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
      
      const { data, error } = await supabase
        .from('farmers')
        .select('id')
        .eq('mobile_number', cleanMobile)
        .maybeSingle();

      if (error) {
        console.error('Error checking farmer existence:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in checkExistingFarmer:', error);
      return false;
    }
  }

  async restoreSession(): Promise<boolean> {
    try {
      const storedAuth = await secureStorage.getItem('farmer_auth');
      
      if (!storedAuth) {
        return false;
      }

      const { farmer, token } = JSON.parse(storedAuth);
      
      if (!farmer || !token) {
        return false;
      }

      // Validate token
      if (token.startsWith('offline_')) {
        // Offline token, just restore session
        this.currentFarmer = farmer;
        this.currentToken = token;
        return true;
      } else {
        // TODO: Add token validation via server if needed
        this.currentFarmer = farmer;
        this.currentToken = token;
        return true;
      }
    } catch (error) {
      console.error('Error restoring session:', error);
      return false;
    }
  }

  async signOut(): Promise<void> {
    this.currentFarmer = null;
    this.currentToken = null;
    await secureStorage.removeItem('farmer_auth');
  }

  getCurrentFarmer(): any {
    return this.currentFarmer;
  }

  getCurrentToken(): string | null {
    return this.currentToken;
  }

  isAuthenticated(): boolean {
    return !!this.currentFarmer && !!this.currentToken;
  }
}

export const customAuthService = CustomAuthService.getInstance();
