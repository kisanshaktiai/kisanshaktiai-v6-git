
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
  mobileNumber: string;
  carrierName: string;
  displayName: string;
  isActive: boolean;
}

export class MobileNumberService {
  private simDetectionService: SIMDetectionService;

  constructor() {
    this.simDetectionService = new SIMDetectionService();
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

  // Enhanced mobile number detection with SIM support
  async detectMobileNumbers(): Promise<SIMInfo[]> {
    try {
      console.log('Detecting SIMs...');
      const sims = await this.simDetectionService.detectSIMs();
      console.log('Detected SIMs:', sims);
      
      return sims.map(sim => ({
        mobileNumber: sim.phoneNumber,
        carrierName: sim.carrierName,
        displayName: sim.displayName,
        isActive: sim.isActive
      }));
    } catch (error) {
      console.error('Error detecting mobile numbers:', error);
      return [];
    }
  }

  async getMobileNumber(): Promise<string | null> {
    try {
      const storedNumber = await secureStorage.get(STORAGE_KEYS.MOBILE_NUMBER);
      return storedNumber;
    } catch (error) {
      console.error('Error getting stored mobile number:', error);
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

  // Check if user is already registered
  async isRegisteredUser(mobileNumber: string): Promise<boolean> {
    try {
      const syntheticEmail = this.generateSyntheticEmail(mobileNumber);
      
      // Check if user exists in Supabase Auth
      const { data, error } = await supabase.auth.admin.listUsers();
      
      if (error) {
        console.error('Error checking user registration:', error);
        return false;
      }

      const user = data.users.find(u => u.email === syntheticEmail);
      return !!user;
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
  async authenticateWithPin(mobileNumber: string, pin: string): Promise<{ success: boolean; error?: string; isNewUser?: boolean }> {
    try {
      const isRegistered = await this.isRegisteredUser(mobileNumber);
      
      if (!isRegistered) {
        return { success: false, error: 'User not registered', isNewUser: true };
      }

      // Get stored metadata
      const metadataString = await secureStorage.get(STORAGE_KEYS.USER_METADATA);
      const metadata = metadataString ? JSON.parse(metadataString) : null;
      
      // Get device info for password generation
      const deviceInfo = await Device.getId();
      const deviceId = deviceInfo.identifier;

      // Get synthetic email using the new format
      const syntheticEmail = metadata?.synthetic_email || this.generateSyntheticEmail(mobileNumber);

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

      return { success: true };
    } catch (error) {
      console.error('Authentication error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      };
    }
  }

  // Authenticate user (wrapper for existing code compatibility)
  async authenticateUser(mobileNumber: string, pin: string): Promise<{ success: boolean; error?: string; isNewUser?: boolean }> {
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

export const mobileNumberService = new MobileNumberService();
