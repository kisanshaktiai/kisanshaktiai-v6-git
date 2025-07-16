import { supabase } from '../config/supabase';
import { Device } from '@capacitor/device';
import { secureStorage } from './storage/secureStorage';
import { STORAGE_KEYS } from '../config/constants';
import { SIMDetectionService } from './SIMDetectionService';

interface UserData {
  fullName: string;
  location?: {
    state: string;
    district: string;
    village: string;
  };
}

interface RegistrationResult {
  success: boolean;
  error?: string;
  userId?: string;
}

interface LoginResult {
  success: boolean;
  error?: string;
  userId?: string;
}

interface AuthenticationResult {
  success: boolean;
  error?: string;
  userId?: string;
  deviceId?: string;
  token?: string;
}

interface SIMInfo {
  slot: number;
  phoneNumber: string;
  carrierName: string;
  countryCode: string;
  isDefault?: boolean;
}

export class MobileNumberService {
  private static instance: MobileNumberService;

  public static getInstance(): MobileNumberService {
    if (!MobileNumberService.instance) {
      MobileNumberService.instance = new MobileNumberService();
    }
    return MobileNumberService.instance;
  }

  private generateSixDigitPin(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Enhanced mobile number detection with SIM support
  async getMobileNumber(): Promise<string | null> {
    try {
      // Try to get from cache first
      const cachedNumber = await secureStorage.get(STORAGE_KEYS.MOBILE_NUMBER);
      if (cachedNumber) {
        console.log('Using cached mobile number:', cachedNumber);
        return cachedNumber;
      }
      
      // Try to detect from SIM cards
      const defaultSIM = await SIMDetectionService.getInstance().getDefaultSIM();
      if (defaultSIM) {
        console.log('Detected mobile number from default SIM:', defaultSIM.phoneNumber);
        return defaultSIM.phoneNumber;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting mobile number:', error);
      return null;
    }
  }

  async detectSIMCards(): Promise<SIMInfo[]> {
    try {
      return await SIMDetectionService.getInstance().detectSIMCards();
    } catch (error) {
      console.error('Error detecting SIM cards:', error);
      return [];
    }
  }

  formatMobileNumber(number: string): string {
    return SIMDetectionService.getInstance().formatPhoneNumber(number);
  }

  validateMobileNumber(number: string): boolean {
    return SIMDetectionService.getInstance().validatePhoneNumber(number);
  }

  async isRegisteredUser(mobileNumber: string): Promise<boolean> {
    return await this.isUserRegistered(mobileNumber);
  }

  async sendOTP(mobileNumber: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Sending OTP to:', mobileNumber);
      
      // For demo purposes, we'll generate and store a PIN
      const pin = this.generateSixDigitPin();
      console.log('Generated PIN:', pin);
      
      // Store the PIN temporarily (in production, this would be sent via SMS)
      await secureStorage.set(`${STORAGE_KEYS.OTP_PREFIX}${mobileNumber}`, pin);
      await secureStorage.set(`${STORAGE_KEYS.OTP_TIMESTAMP_PREFIX}${mobileNumber}`, Date.now().toString());
      
      // Show PIN in console for testing
      console.log(`OTP for ${mobileNumber}: ${pin}`);
      
      return { success: true };
    } catch (error) {
      console.error('Error sending OTP:', error);
      return { success: false, error: 'Failed to send OTP' };
    }
  }

  async verifyOTP(mobileNumber: string, otp: string): Promise<{ success: boolean; error?: string }> {
    try {
      const storedOtp = await secureStorage.get(`${STORAGE_KEYS.OTP_PREFIX}${mobileNumber}`);
      const timestamp = await secureStorage.get(`${STORAGE_KEYS.OTP_TIMESTAMP_PREFIX}${mobileNumber}`);
      
      if (!storedOtp || !timestamp) {
        return { success: false, error: 'OTP not found or expired' };
      }
      
      // Check if OTP is expired (5 minutes)
      const otpAge = Date.now() - parseInt(timestamp);
      if (otpAge > 5 * 60 * 1000) {
        await secureStorage.remove(`${STORAGE_KEYS.OTP_PREFIX}${mobileNumber}`);
        await secureStorage.remove(`${STORAGE_KEYS.OTP_TIMESTAMP_PREFIX}${mobileNumber}`);
        return { success: false, error: 'OTP has expired' };
      }
      
      if (storedOtp !== otp) {
        return { success: false, error: 'Invalid OTP' };
      }
      
      // Clean up OTP
      await secureStorage.remove(`${STORAGE_KEYS.OTP_PREFIX}${mobileNumber}`);
      await secureStorage.remove(`${STORAGE_KEYS.OTP_TIMESTAMP_PREFIX}${mobileNumber}`);
      
      return { success: true };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return { success: false, error: 'Failed to verify OTP' };
    }
  }

  async authenticateUser(mobileNumber: string): Promise<AuthenticationResult> {
    try {
      // Check if user is already registered
      const isRegistered = await this.isUserRegistered(mobileNumber);
      
      if (isRegistered) {
        // Existing user - try to log them in
        return await this.loginExistingUser(mobileNumber);
      } else {
        // New user - register them with basic info
        const result = await this.registerUser(mobileNumber, '0000', {
          fullName: 'User', // Default name
        });
        
        if (result.success) {
          const deviceInfo = await Device.getId();
          return {
            success: true,
            userId: result.userId,
            deviceId: deviceInfo.identifier,
            token: 'demo_token',
          };
        } else {
          return { success: false, error: result.error };
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }

  async authenticateWithPin(mobileNumber: string, pin: string): Promise<LoginResult> {
    return await this.loginUser(mobileNumber, pin);
  }

  private async loginExistingUser(mobileNumber: string): Promise<AuthenticationResult> {
    try {
      // Get stored metadata
      const metadataString = await secureStorage.get(STORAGE_KEYS.USER_METADATA);
      const metadata = metadataString ? JSON.parse(metadataString) : null;
      
      // Get synthetic email from metadata or generate it
      const cleanMobileNumber = mobileNumber.replace('+', '');
      const syntheticEmail = metadata?.synthetic_email || `${cleanMobileNumber}@kisanshaktiai.in`;

      // For existing users, we'll use a default PIN if none is stored
      const storedPinHash = await secureStorage.get(STORAGE_KEYS.PIN_HASH);
      const defaultPassword = storedPinHash ? 
        `${mobileNumber}_${atob(storedPinHash)}` : 
        `${mobileNumber}_0000`;

      // Sign in user with synthetic email
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: syntheticEmail,
        password: defaultPassword
      });

      if (authError) {
        console.error('Authentication error:', authError);
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Login failed' };
      }

      // Update stored user ID
      await secureStorage.set(STORAGE_KEYS.USER_ID, authData.user.id);
      
      const deviceInfo = await Device.getId();
      console.log('User logged in successfully:', authData.user.id);
      
      return { 
        success: true, 
        userId: authData.user.id,
        deviceId: deviceInfo.identifier,
        token: 'demo_token',
      };

    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Login failed' };
    }
  }

  async registerUser(mobileNumber: string, pin: string, userData: UserData): Promise<RegistrationResult> {
    try {
      // Get device info
      const deviceInfo = await Device.getId();
      const deviceId = deviceInfo.identifier;

      // Create a proper email using kisanshaktiai.in domain
      const cleanMobileNumber = mobileNumber.replace('+', '');
      const syntheticEmail = `${cleanMobileNumber}@kisanshaktiai.in`;
      
      // Create user in Supabase Auth with synthetic email
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: syntheticEmail,
        password: `${mobileNumber}_${pin}`, // Use mobile + pin as password
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            phone: mobileNumber,
            full_name: userData.fullName,
            pin_hash: btoa(pin),
          }
        }
      });

      if (authError) {
        console.error('Auth signup error:', authError);
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'User creation failed' };
      }

      // Wait a moment for the user to be properly created
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Store authentication info
      await secureStorage.set(STORAGE_KEYS.USER_ID, authData.user.id);
      await secureStorage.set(STORAGE_KEYS.MOBILE_NUMBER, mobileNumber);
      await secureStorage.set(STORAGE_KEYS.PIN_HASH, btoa(pin));
      await secureStorage.set(STORAGE_KEYS.USER_METADATA, JSON.stringify({
        fullName: userData.fullName,
        location: userData.location,
        synthetic_email: syntheticEmail,
        device_id: deviceId,
        registered_at: new Date().toISOString()
      }));

      console.log('User registered successfully:', authData.user.id);
      return { 
        success: true, 
        userId: authData.user.id 
      };

    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Registration failed' };
    }
  }

  async loginUser(mobileNumber: string, pin: string): Promise<LoginResult> {
    try {
      // Get stored metadata
      const metadataString = await secureStorage.get(STORAGE_KEYS.USER_METADATA);
      const metadata = metadataString ? JSON.parse(metadataString) : null;
      
      // Verify PIN
      const storedPinHash = await secureStorage.get(STORAGE_KEYS.PIN_HASH);
      const currentPinHash = btoa(pin);
      
      if (!storedPinHash || storedPinHash !== currentPinHash) {
        return { success: false, error: 'Invalid PIN' };
      }

      // Get synthetic email from metadata or generate it
      const cleanMobileNumber = mobileNumber.replace('+', '');
      const syntheticEmail = metadata?.synthetic_email || `${cleanMobileNumber}@kisanshaktiai.in`;

      // Sign in user with synthetic email
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: syntheticEmail,
        password: `${mobileNumber}_${pin}`
      });

      if (authError) {
        console.error('Authentication error:', authError);
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Login failed' };
      }

      // Update stored user ID
      await secureStorage.set(STORAGE_KEYS.USER_ID, authData.user.id);
      
      console.log('User logged in successfully:', authData.user.id);
      return { 
        success: true, 
        userId: authData.user.id 
      };

    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Login failed' };
    }
  }

  async isUserRegistered(mobileNumber: string): Promise<boolean> {
    try {
      const storedMobile = await secureStorage.get(STORAGE_KEYS.MOBILE_NUMBER);
      const storedPinHash = await secureStorage.get(STORAGE_KEYS.PIN_HASH);
      
      return storedMobile === mobileNumber && !!storedPinHash;
    } catch (error) {
      console.error('Error checking user registration:', error);
      return false;
    }
  }

  async getCurrentUserMobile(): Promise<string | null> {
    try {
      return await secureStorage.get(STORAGE_KEYS.MOBILE_NUMBER);
    } catch (error) {
      console.error('Error getting current user mobile:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
      await secureStorage.clear();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }
}
