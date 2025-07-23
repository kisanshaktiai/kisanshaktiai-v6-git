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
  private maxRetries: number = 3;
  private retryDelay: number = 1000;

  static getInstance(): CustomAuthService {
    if (!CustomAuthService.instance) {
      CustomAuthService.instance = new CustomAuthService();
    }
    return CustomAuthService.instance;
  }

  private async retryOperation<T>(operation: () => Promise<T>, retries: number = this.maxRetries): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await operation();
      } catch (error) {
        console.error(`Attempt ${i + 1} failed:`, error);
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (i + 1)));
      }
    }
    throw new Error('Max retries exceeded');
  }

  private validateMobileNumber(mobile: string): boolean {
    const cleanMobile = mobile.replace(/\D/g, '');
    return cleanMobile.length === 10 && /^[6-9]\d{9}$/.test(cleanMobile);
  }

  private validatePin(pin: string): boolean {
    return pin.length === 4 && /^\d{4}$/.test(pin);
  }

  async register(mobileNumber: string, pin: string, farmerData: any = {}): Promise<AuthResponse> {
    try {
      // Validate inputs
      if (!this.validateMobileNumber(mobileNumber)) {
        return {
          success: false,
          error: 'Please enter a valid 10-digit mobile number'
        };
      }

      if (!this.validatePin(pin)) {
        return {
          success: false,
          error: 'PIN must be exactly 4 digits'
        };
      }

      // Clean mobile number (remove any non-digits)
      const cleanMobile = mobileNumber.replace(/\D/g, '');
      
      console.log('CustomAuthService: Registering farmer with mobile:', cleanMobile);
      console.log('CustomAuthService: Registration data:', farmerData);
      
      // Enhanced registration with proper tenant ID and retry logic
      const result = await this.retryOperation(async () => {
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
          console.error('CustomAuthService: Registration error:', error);
          throw new Error(error.message || 'Registration failed');
        }

        return data;
      });

      console.log('CustomAuthService: Registration response:', result);

      if (!result || !result.success) {
        console.error('CustomAuthService: Registration failed:', result?.error);
        return { 
          success: false, 
          error: result?.error || 'Registration failed' 
        };
      }

      // Validate response data
      if (!result.farmer || !result.farmer.id) {
        console.error('CustomAuthService: Invalid farmer data in response');
        return {
          success: false,
          error: 'Invalid registration response'
        };
      }

      // Store authentication data
      this.currentFarmer = result.farmer;
      this.currentToken = result.token;
      this.currentUserProfile = result.user_profile;
      
      // Save to secure storage with enhanced data
      const authData = {
        farmer: result.farmer,
        token: result.token,
        user_profile: result.user_profile,
        registered_at: new Date().toISOString()
      };

      await secureStorage.setItem('farmer_auth', JSON.stringify(authData));
      console.log('CustomAuthService: Auth data stored successfully');

      return { 
        success: true, 
        farmer: result.farmer,
        user_profile: result.user_profile,
        userId: result.farmer.id,
        token: result.token
      };
    } catch (error) {
      console.error('CustomAuthService: Registration process error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Registration failed' 
      };
    }
  }

  async login(mobileNumber: string, pin: string): Promise<AuthResponse> {
    try {
      // Validate inputs
      if (!this.validateMobileNumber(mobileNumber)) {
        return {
          success: false,
          error: 'Please enter a valid 10-digit mobile number'
        };
      }

      if (!this.validatePin(pin)) {
        return {
          success: false,
          error: 'PIN must be exactly 4 digits'
        };
      }

      // Clean mobile number (remove any non-digits)
      const cleanMobile = mobileNumber.replace(/\D/g, '');
      
      console.log('CustomAuthService: Logging in farmer with mobile:', cleanMobile);
      
      // Enhanced login with retry logic
      const result = await this.retryOperation(async () => {
        const { data, error } = await supabase.functions.invoke('custom-auth-login', {
          body: {
            mobile_number: cleanMobile,
            pin
          }
        });

        if (error) {
          console.error('CustomAuthService: Login error:', error);
          throw new Error(error.message || 'Login failed');
        }

        return data;
      });

      console.log('CustomAuthService: Login response:', result);

      if (!result || !result.success) {
        console.error('CustomAuthService: Login failed:', result?.error);
        return { 
          success: false, 
          error: result?.error || 'Login failed' 
        };
      }

      // Validate response data
      if (!result.farmer || !result.farmer.id) {
        console.error('CustomAuthService: Invalid farmer data in response');
        return {
          success: false,
          error: 'Invalid login response'
        };
      }

      // Store authentication data
      this.currentFarmer = result.farmer;
      this.currentToken = result.token;
      this.currentUserProfile = result.user_profile;
      
      // Save to secure storage with enhanced data
      const authData = {
        farmer: result.farmer,
        token: result.token,
        user_profile: result.user_profile,
        logged_in_at: new Date().toISOString()
      };

      await secureStorage.setItem('farmer_auth', JSON.stringify(authData));
      console.log('CustomAuthService: Auth data stored successfully');

      return { 
        success: true, 
        farmer: result.farmer,
        user_profile: result.user_profile,
        userId: result.farmer.id,
        token: result.token
      };
    } catch (error) {
      console.error('CustomAuthService: Login process error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      };
    }
  }

  async checkExistingFarmer(mobileNumber: string): Promise<boolean> {
    try {
      if (!this.validateMobileNumber(mobileNumber)) {
        return false;
      }

      const cleanMobile = mobileNumber.replace(/\D/g, '');
      
      console.log('CustomAuthService: Checking existing farmer with mobile:', cleanMobile);
      
      const { data, error } = await supabase
        .from('farmers')
        .select('id, mobile_number, tenant_id')
        .eq('mobile_number', cleanMobile)
        .eq('tenant_id', DEFAULT_TENANT_ID)
        .maybeSingle();

      if (error) {
        console.error('CustomAuthService: Error checking farmer existence:', error);
        return false;
      }

      const exists = !!data;
      console.log('CustomAuthService: Farmer exists:', exists, data);
      return exists;
    } catch (error) {
      console.error('CustomAuthService: Error in checkExistingFarmer:', error);
      return false;
    }
  }

  async restoreSession(): Promise<boolean> {
    try {
      console.log('CustomAuthService: Attempting to restore session');
      const storedAuth = await secureStorage.getItem('farmer_auth');
      
      if (!storedAuth) {
        console.log('CustomAuthService: No stored authentication found');
        return false;
      }

      const { farmer, token, user_profile } = JSON.parse(storedAuth);
      
      if (!farmer || !token || !farmer.id) {
        console.log('CustomAuthService: Invalid stored authentication data');
        return false;
      }

      console.log('CustomAuthService: Restoring session for farmer:', farmer.id);

      // Restore session state
      this.currentFarmer = farmer;
      this.currentToken = token;
      this.currentUserProfile = user_profile;
      
      console.log('CustomAuthService: Session restored successfully');
      return true;
    } catch (error) {
      console.error('CustomAuthService: Error restoring session:', error);
      return false;
    }
  }

  async signOut(): Promise<void> {
    console.log('CustomAuthService: Signing out farmer');
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
    const authenticated = !!this.currentFarmer && !!this.currentToken;
    console.log('CustomAuthService: Authentication status:', authenticated);
    return authenticated;
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
      console.log('CustomAuthService: Refreshing user profile for farmer:', this.currentFarmer.id);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', this.currentFarmer.id)
        .maybeSingle();

      if (!error && data) {
        this.currentUserProfile = data;
        console.log('CustomAuthService: User profile refreshed successfully');
        
        // Update stored data
        const storedAuth = await secureStorage.getItem('farmer_auth');
        if (storedAuth) {
          const authData = JSON.parse(storedAuth);
          authData.user_profile = data;
          await secureStorage.setItem('farmer_auth', JSON.stringify(authData));
        }
      } else {
        console.error('CustomAuthService: Error refreshing user profile:', error);
      }
    } catch (error) {
      console.error('CustomAuthService: Error refreshing user profile:', error);
    }
  }
}

export const customAuthService = CustomAuthService.getInstance();
