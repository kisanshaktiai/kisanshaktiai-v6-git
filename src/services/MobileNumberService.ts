import { supabase } from '../config/supabase';
import { Device } from '@capacitor/device';
import { secureStorage } from './storage/secureStorage';
import { STORAGE_KEYS } from '../config/constants';
import { SIMDetectionService } from './SIMDetectionService';

export interface UserData {
  fullName: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    district?: string;
    state?: string;
  };
}

export interface SIMInfo {
  slot: number;
  phoneNumber: string;
  carrierName: string;
  countryCode: string;
  isActive: boolean;
  displayName: string;
  isDefault?: boolean;
}

export class MobileNumberService {
  private static instance: MobileNumberService;
  private simDetectionService: SIMDetectionService;

  private constructor() {
    this.simDetectionService = new SIMDetectionService();
  }

  public static getInstance(): MobileNumberService {
    if (!MobileNumberService.instance) {
      MobileNumberService.instance = new MobileNumberService();
    }
    return MobileNumberService.instance;
  }

  private generateSixDigitPin(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateSyntheticEmail(mobileNumber: string): string {
    // Remove country code and any special characters
    const cleanMobileNumber = mobileNumber.replace(/[^\d]/g, '');
    // Remove leading 91 if present (Indian country code)
    const phoneNumber = cleanMobileNumber.startsWith('91') ? 
      cleanMobileNumber.substring(2) : cleanMobileNumber;
    
    return `farmer.${phoneNumber}@kisanshakti.com`;
  }

  // Enhanced mobile number detection with real SIM support
  async detectMobileNumbers(): Promise<SIMInfo[]> {
    try {
      console.log('Detecting SIMs...');
      
      // Check platform capabilities
      const platformInfo = await this.simDetectionService.getPlatformInfo();
      console.log('Platform info:', platformInfo);
      
      const sims = await this.simDetectionService.detectSIMs();
      console.log('Detected SIMs:', sims);
      
      return sims.map(sim => ({
        slot: sim.slot,
        phoneNumber: sim.phoneNumber,
        carrierName: sim.carrierName,
        countryCode: sim.countryCode,
        isActive: sim.isActive,
        displayName: sim.displayName,
        isDefault: sim.slot === 1
      }));
    } catch (error) {
      console.error('Error detecting mobile numbers:', error);
      // Return empty array on error - UI will handle manual entry
      return [];
    }
  }

  // Add method for backward compatibility
  async detectSIMCards(): Promise<SIMInfo[]> {
    return this.detectMobileNumbers();
  }

  // Enhanced method to get stored or detected mobile number
  async getMobileNumber(): Promise<string | null> {
    try {
      // First try to get from storage
      const storedNumber = await secureStorage.get(STORAGE_KEYS.MOBILE_NUMBER);
      if (storedNumber) {
        return storedNumber;
      }

      // If not stored, try to detect from SIM
      const primarySIM = await this.simDetectionService.getPrimarySIM();
      if (primarySIM && primarySIM.phoneNumber) {
        return primarySIM.phoneNumber;
      }

      return null;
    } catch (error) {
      console.error('Error getting mobile number:', error);
      return null;
    }
  }

  formatMobileNumber(number: string): string {
    // Remove all non-digit characters
    const digits = number.replace(/\D/g, '');
    
    // Add country code if not present
    if (digits.length === 10) {
      return `+91${digits}`;
    } else if (digits.length === 12 && digits.startsWith('91')) {
      return `+${digits}`;
    } else if (digits.length === 13 && digits.startsWith('91')) {
      return `+${digits.substring(0, 12)}`;
    }
    
    return `+${digits}`;
  }

  validateMobileNumber(number: string): boolean {
    const digits = number.replace(/\D/g, '');
    
    // Check for Indian mobile number format
    if (digits.length === 10) {
      return /^[6-9]\d{9}$/.test(digits);
    } else if (digits.length === 12 && digits.startsWith('91')) {
      const mobileDigits = digits.substring(2);
      return /^[6-9]\d{9}$/.test(mobileDigits);
    }
    
    return false;
  }

  // Updated to use the mobile-auth-check Edge Function for consistency
  async isRegisteredUser(mobileNumber: string): Promise<boolean> {
    try {
      console.log('=== MOBILE NUMBER SERVICE: CHECKING USER REGISTRATION ===');
      const cleanPhone = mobileNumber.replace(/\D/g, '');
      
      // Use the mobile-auth-check Edge Function for consistent checking
      const { data, error } = await supabase.functions.invoke('mobile-auth-check', {
        body: { 
          phone: cleanPhone,
          checkOnly: true
        }
      });

      if (error) {
        console.error('Error checking user registration via Edge Function:', error);
        return false;
      }

      const isRegistered = data?.userExists || false;
      console.log('User registration check result:', {
        phone: cleanPhone.replace(/\d/g, '*'),
        isRegistered
      });

      return isRegistered;
    } catch (error) {
      console.error('Error checking user registration:', error);
      return false;
    }
  }

  // Generate and store OTP
  async generateOTP(mobileNumber: string): Promise<string> {
    const otp = this.generateSixDigitPin();
    const timestamp = Date.now();
    
    try {
      await secureStorage.set(STORAGE_KEYS.OTP_PREFIX + mobileNumber, otp);
      await secureStorage.set(STORAGE_KEYS.OTP_TIMESTAMP_PREFIX + mobileNumber, timestamp.toString());
      
      console.log(`OTP generated for ${mobileNumber}: ${otp}`);
      return otp;
    } catch (error) {
      console.error('Error storing OTP:', error);
      throw error;
    }
  }

  // Verify OTP
  async verifyOTP(mobileNumber: string, enteredOTP: string): Promise<boolean> {
    try {
      const storedOTP = await secureStorage.get(STORAGE_KEYS.OTP_PREFIX + mobileNumber);
      const timestamp = await secureStorage.get(STORAGE_KEYS.OTP_TIMESTAMP_PREFIX + mobileNumber);
      
      if (!storedOTP || !timestamp) {
        return false;
      }

      // Check if OTP is expired (5 minutes)
      const otpAge = Date.now() - parseInt(timestamp);
      const fiveMinutes = 5 * 60 * 1000;
      
      if (otpAge > fiveMinutes) {
        await secureStorage.remove(STORAGE_KEYS.OTP_PREFIX + mobileNumber);
        await secureStorage.remove(STORAGE_KEYS.OTP_TIMESTAMP_PREFIX + mobileNumber);
        return false;
      }

      const isValid = storedOTP === enteredOTP;
      
      if (isValid) {
        // Clean up OTP after successful verification
        await secureStorage.remove(STORAGE_KEYS.OTP_PREFIX + mobileNumber);
        await secureStorage.remove(STORAGE_KEYS.OTP_TIMESTAMP_PREFIX + mobileNumber);
      }
      
      return isValid;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return false;
    }
  }

  // Register new user
  async registerUser(mobileNumber: string, pin: string, userData: UserData): Promise<{ success: boolean; error?: string; userId?: string }> {
    try {
      // Store user data temporarily
      await secureStorage.set(STORAGE_KEYS.USER_ID, '');
      await secureStorage.set(STORAGE_KEYS.MOBILE_NUMBER, mobileNumber);
      await secureStorage.set(STORAGE_KEYS.PIN_HASH, pin);
      await secureStorage.set(STORAGE_KEYS.USER_METADATA, JSON.stringify(userData));

      // Get device info
      const deviceInfo = await Device.getId();
      const deviceId = deviceInfo.identifier;

      // Create a proper email using the new format
      const syntheticEmail = this.generateSyntheticEmail(mobileNumber);
      
      // Create user in Supabase Auth with synthetic email
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: syntheticEmail,
        password: `${mobileNumber}_${pin}_${deviceId}`, // Unique password
        options: {
          data: {
            phone: mobileNumber,
            device_id: deviceId,
            synthetic_email: syntheticEmail,
            full_name: userData.fullName,
            location: userData.location
          }
        }
      });

      if (authError) {
        console.error('Registration error:', authError);
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Failed to create user' };
      }

      console.log('User registered successfully:', authData.user.id);

      // Wait for the session to be established
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update stored user ID
      await secureStorage.set(STORAGE_KEYS.USER_ID, authData.user.id);

      return { 
        success: true, 
        userId: authData.user.id 
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Registration failed' 
      };
    }
  }

  // Authenticate user with PIN
  async authenticateWithPin(mobileNumber: string, pin: string): Promise<{ success: boolean; error?: string; userId?: string; isNewUser?: boolean }> {
    try {
      const isRegistered = await this.isRegisteredUser(mobileNumber);
      
      if (!isRegistered) {
        return { success: false, error: 'User not registered', isNewUser: true };
      }

      // Get device info for password generation
      const deviceInfo = await Device.getId();
      const deviceId = deviceInfo.identifier;

      // Get synthetic email using the new format
      const syntheticEmail = this.generateSyntheticEmail(mobileNumber);

      // Generate password (same logic as registration)
      const password = `${mobileNumber}_${pin}_${deviceId}`;

      // Sign in user with synthetic email and generated password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: syntheticEmail,
        password: password
      });

      if (authError) {
        console.error('Authentication error:', authError);
        return { success: false, error: 'Invalid PIN or authentication failed' };
      }

      if (!authData.user) {
        return { success: false, error: 'Authentication failed' };
      }

      // Store authentication data
      await secureStorage.set(STORAGE_KEYS.USER_ID, authData.user.id);
      await secureStorage.set(STORAGE_KEYS.MOBILE_NUMBER, mobileNumber);
      await secureStorage.set(STORAGE_KEYS.PIN_HASH, pin);

      console.log('User authenticated successfully:', authData.user.id);

      return { success: true, userId: authData.user.id };
    } catch (error) {
      console.error('Authentication error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      };
    }
  }

  // Authenticate user (wrapper for existing code compatibility)
  async authenticateUser(mobileNumber: string, pin?: string): Promise<{ success: boolean; error?: string; userId?: string; deviceId?: string; token?: string }> {
    if (!pin) {
      // For backward compatibility - generate a mock response
      const deviceInfo = await Device.getId();
      return { 
        success: true, 
        deviceId: deviceInfo.identifier, 
        token: `mock_token_${Date.now()}` 
      };
    }
    return this.authenticateWithPin(mobileNumber, pin);
  }

  // Get current mobile number from storage
  async getCurrentMobileNumber(): Promise<string | null> {
    try {
      return await secureStorage.get(STORAGE_KEYS.MOBILE_NUMBER);
    } catch (error) {
      console.error('Error getting current mobile number:', error);
      return null;
    }
  }

  // Clear all stored data (logout)
  async clearStoredData(): Promise<void> {
    try {
      await secureStorage.remove(STORAGE_KEYS.USER_ID);
      await secureStorage.remove(STORAGE_KEYS.MOBILE_NUMBER);
      await secureStorage.remove(STORAGE_KEYS.PIN_HASH);
      await secureStorage.remove(STORAGE_KEYS.USER_METADATA);
    } catch (error) {
      console.error('Error clearing stored data:', error);
    }
  }
}

// Export the singleton instance
export const mobileNumberService = MobileNumberService.getInstance();
