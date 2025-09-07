import { supabase } from '@/integrations/supabase/client';
import { secureStorage } from './storage/secureStorage';
import { STORAGE_KEYS } from '@/config/constants';
import { TenantDetectionService } from './TenantDetectionService';

export interface AuthResult {
  success: boolean;
  userId?: string;
  tenantId?: string;
  farmer?: any;
  profile?: any;
  error?: string;
  isNewUser?: boolean;
  session?: any;
}

export interface RegistrationData {
  mobileNumber: string;
  pin: string;
  fullName: string;
  tenantId?: string;
  location?: {
    latitude: number;
    longitude: number;
    district?: string;
    state?: string;
  };
  preferredLanguage?: string;
}

export class TenantAuthService {
  private static instance: TenantAuthService;
  private tenantDetectionService: TenantDetectionService;

  private constructor() {
    this.tenantDetectionService = TenantDetectionService.getInstance();
  }

  public static getInstance(): TenantAuthService {
    if (!TenantAuthService.instance) {
      TenantAuthService.instance = new TenantAuthService();
    }
    return TenantAuthService.instance;
  }

  /**
   * Register new farmer with PIN and tenant association
   */
  async registerFarmer(data: RegistrationData): Promise<AuthResult> {
    try {
      console.log('=== TENANT AUTH: FARMER REGISTRATION ===');
      
      // Detect tenant if not provided - get from URL/domain
      let tenantId = data.tenantId;
      if (!tenantId) {
        const currentHost = window.location.hostname;
        const { data: tenantData } = await supabase.functions.invoke('detect-tenant', {
          body: { domain: currentHost }
        });
        tenantId = tenantData?.tenant?.id;
      }
      
      if (!tenantId) {
        console.error('No tenant detected for registration');
        return {
          success: false,
          error: 'Unable to detect tenant. Please ensure you are accessing from a valid tenant domain.'
        };
      }

      // Clean mobile number
      const cleanMobile = data.mobileNumber.replace(/\D/g, '');
      
      // Validate mobile number
      if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
        return {
          success: false,
          error: 'Invalid mobile number format'
        };
      }

      // Validate PIN (4 digits as per database)
      if (data.pin.length !== 4 || !/^\d{4}$/.test(data.pin)) {
        return {
          success: false,
          error: 'PIN must be exactly 4 digits'
        };
      }

      console.log('Registering farmer for tenant:', tenantId);

      // Call the enhanced mobile-auth-pin edge function
      console.log('Invoking mobile-auth-pin function for registration');
      const { data: authData, error: authError } = await supabase.functions.invoke('mobile-auth-pin', {
        body: {
          action: 'register',
          mobile_number: cleanMobile,
          pin: data.pin,
          tenant_id: tenantId,
          full_name: data.fullName,
          location: data.location,
          preferred_language: data.preferredLanguage || 'hi'
        }
      });
      
      console.log('Registration response:', { success: authData?.success, error: authError });

      if (authError || !authData?.success) {
        console.error('Registration failed:', authError || authData?.error);
        return {
          success: false,
          error: authData?.error || authError?.message || 'Registration failed'
        };
      }

      // Store PIN hash locally for quick validation
      await this.storePinHash(cleanMobile, data.pin);

      // Store tenant association
      await secureStorage.set(STORAGE_KEYS.CURRENT_TENANT, tenantId);

      // Sign in with the credentials
      if (authData.credentials) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: authData.credentials.email,
          password: authData.credentials.password
        });

        if (signInError) {
          console.error('Auto sign-in after registration failed:', signInError);
        } else {
          console.log('Auto sign-in successful after registration');
        }
      }

      return {
        success: true,
        userId: authData.userId,
        tenantId: authData.tenantId,
        farmer: authData.farmer,
        profile: authData.profile,
        isNewUser: true,
        session: authData.session
      };

    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  }

  /**
   * Authenticate farmer with mobile number and PIN
   */
  async authenticateFarmer(mobileNumber: string, pin: string): Promise<AuthResult> {
    try {
      console.log('=== TENANT AUTH: FARMER AUTHENTICATION ===');
      
      const cleanMobile = mobileNumber.replace(/\D/g, '');
      
      // Validate inputs
      if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
        return {
          success: false,
          error: 'Invalid mobile number format'
        };
      }

      if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        return {
          success: false,
          error: 'Invalid PIN format - must be 4 digits'
        };
      }

      // Check local PIN hash first for quick validation
      const isValidPin = await this.validatePinLocally(cleanMobile, pin);
      if (isValidPin === false) {
        console.log('Local PIN validation failed');
        // Don't return error immediately, try server validation
      }

      // Call the enhanced mobile-auth-pin edge function
      console.log('Invoking mobile-auth-pin function for login');
      const { data: authData, error: authError } = await supabase.functions.invoke('mobile-auth-pin', {
        body: {
          action: 'login',
          mobile_number: cleanMobile,
          pin: pin
        }
      });
      
      console.log('Login response:', { success: authData?.success, error: authError });

      if (authError || !authData?.success) {
        console.error('Authentication failed:', authError || authData?.error);
        return {
          success: false,
          error: authData?.error || authError?.message || 'Invalid mobile number or PIN'
        };
      }

      // Update local PIN hash on successful authentication
      await this.storePinHash(cleanMobile, pin);

      // Store tenant association
      if (authData.tenantId) {
        await secureStorage.set(STORAGE_KEYS.CURRENT_TENANT, authData.tenantId);
      }

      // Sign in with the credentials
      if (authData.credentials) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: authData.credentials.email,
          password: authData.credentials.password
        });

        if (signInError) {
          console.error('Session creation failed:', signInError);
          return {
            success: false,
            error: 'Failed to create session'
          };
        }

        console.log('Session created successfully');
      }

      return {
        success: true,
        userId: authData.userId,
        tenantId: authData.tenantId,
        farmer: authData.farmer,
        profile: authData.profile,
        isNewUser: false,
        session: authData.session
      };

    } catch (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  /**
   * Check if user exists for a mobile number
   */
  async checkUserExists(mobileNumber: string): Promise<boolean> {
    try {
      const cleanMobile = mobileNumber.replace(/\D/g, '');
      
      const { data, error } = await supabase.functions.invoke('mobile-auth-check', {
        body: { 
          phone: cleanMobile,
          checkOnly: true
        }
      });

      if (error) {
        console.error('Error checking user existence:', error);
        return false;
      }

      return data?.userExists || false;
    } catch (error) {
      console.error('Error in checkUserExists:', error);
      return false;
    }
  }

  /**
   * Update farmer PIN
   */
  async updatePin(mobileNumber: string, oldPin: string, newPin: string): Promise<AuthResult> {
    try {
      const cleanMobile = mobileNumber.replace(/\D/g, '');
      
      // Validate new PIN (4 digits as per database)
      if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        return {
          success: false,
          error: 'New PIN must be exactly 4 digits'
        };
      }

      // Call edge function to update PIN
      const { data, error } = await supabase.functions.invoke('mobile-auth-pin', {
        body: {
          action: 'update_pin',
          mobile_number: cleanMobile,
          old_pin: oldPin,
          new_pin: newPin
        }
      });

      if (error || !data?.success) {
        return {
          success: false,
          error: data?.error || error?.message || 'Failed to update PIN'
        };
      }

      // Update local PIN hash
      await this.storePinHash(cleanMobile, newPin);

      return {
        success: true
      };

    } catch (error) {
      console.error('Error updating PIN:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update PIN'
      };
    }
  }

  /**
   * Reset PIN with OTP verification
   */
  async resetPin(mobileNumber: string, otp: string, newPin: string): Promise<AuthResult> {
    try {
      const cleanMobile = mobileNumber.replace(/\D/g, '');
      
      // Validate new PIN (4 digits as per database)
      if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        return {
          success: false,
          error: 'New PIN must be exactly 4 digits'
        };
      }

      // Call edge function to reset PIN
      const { data, error } = await supabase.functions.invoke('mobile-auth-pin', {
        body: {
          action: 'reset_pin',
          mobile_number: cleanMobile,
          otp: otp,
          new_pin: newPin
        }
      });

      if (error || !data?.success) {
        return {
          success: false,
          error: data?.error || error?.message || 'Failed to reset PIN'
        };
      }

      // Update local PIN hash
      await this.storePinHash(cleanMobile, newPin);

      return {
        success: true
      };

    } catch (error) {
      console.error('Error resetting PIN:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reset PIN'
      };
    }
  }

  /**
   * Store PIN hash locally for quick validation
   */
  private async storePinHash(mobileNumber: string, pin: string): Promise<void> {
    try {
      // Simple hash for local validation (not for security, just for quick check)
      const hash = btoa(`${mobileNumber}:${pin}:kisanshakti`);
      await secureStorage.set(`${STORAGE_KEYS.PIN_HASH}_${mobileNumber}`, hash);
    } catch (error) {
      console.error('Error storing PIN hash:', error);
    }
  }

  /**
   * Validate PIN locally for quick check
   */
  private async validatePinLocally(mobileNumber: string, pin: string): Promise<boolean | null> {
    try {
      const storedHash = await secureStorage.get(`${STORAGE_KEYS.PIN_HASH}_${mobileNumber}`);
      if (!storedHash) {
        return null; // No local hash, need server validation
      }
      
      const expectedHash = btoa(`${mobileNumber}:${pin}:kisanshakti`);
      return storedHash === expectedHash;
    } catch (error) {
      console.error('Error validating PIN locally:', error);
      return null;
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      // Clear local storage
      await secureStorage.remove(STORAGE_KEYS.CURRENT_TENANT);
      await secureStorage.remove(STORAGE_KEYS.USER_ID);
      await secureStorage.remove(STORAGE_KEYS.MOBILE_NUMBER);
      
      // Clear PIN hashes - try to clear known mobile numbers
      // Since we can't get all keys, clear the current user's PIN hash
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata?.mobile_number) {
          await secureStorage.remove(`${STORAGE_KEYS.PIN_HASH}_${user.user_metadata.mobile_number}`);
        }
      } catch (e) {
        console.log('Could not clear PIN hash');
      }

      // Sign out from Supabase
      await supabase.auth.signOut();
      
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  /**
   * Get current authenticated farmer
   */
  async getCurrentFarmer(): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      // Get farmer data with tenant association
      const { data: farmer, error } = await supabase
        .from('farmers')
        .select(`
          *,
          tenant:tenants(
            id,
            name,
            slug,
            tenant_branding(*)
          )
        `)
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching farmer:', error);
        return null;
      }

      return farmer;
    } catch (error) {
      console.error('Error getting current farmer:', error);
      return null;
    }
  }
}

// Export singleton instance
export const tenantAuthService = TenantAuthService.getInstance();