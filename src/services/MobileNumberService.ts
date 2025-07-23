
import { Capacitor } from '@capacitor/core';
import { customAuthService } from './customAuthService';
import { supabase } from '@/integrations/supabase/client';
import { SIMDetectionService, SIMCard } from './SIMDetectionService';

// Re-export the SIMCard interface as SIMInfo for backward compatibility
export type SIMInfo = SIMCard;

export interface AuthResult {
  success: boolean;
  farmer?: any;
  user_profile?: any;
  token?: string;
  error?: string;
}

export class MobileNumberService {
  private static instance: MobileNumberService;
  private cachedMobileNumber: string | null = null;
  private simDetectionService: SIMDetectionService;

  private constructor() {
    this.simDetectionService = new SIMDetectionService();
  }

  static getInstance(): MobileNumberService {
    if (!MobileNumberService.instance) {
      MobileNumberService.instance = new MobileNumberService();
    }
    return MobileNumberService.instance;
  }

  async getMobileNumber(): Promise<string | null> {
    if (this.cachedMobileNumber) {
      return this.cachedMobileNumber;
    }

    if (Capacitor.isNativePlatform()) {
      try {
        const sims = await this.detectSIMCards();
        if (sims.length > 0) {
          const mobileNumber = sims[0].phoneNumber;
          this.cachedMobileNumber = mobileNumber;
          return mobileNumber;
        }
      } catch (error) {
        console.error('Error detecting SIM cards:', error);
      }
    }

    // Try to retrieve from local storage as fallback
    const storedNumber = localStorage.getItem('mobile_number');
    if (storedNumber) {
      this.cachedMobileNumber = storedNumber;
      return storedNumber;
    }

    return null;
  }

  async saveMobileNumber(mobileNumber: string): Promise<void> {
    this.cachedMobileNumber = mobileNumber;
    localStorage.setItem('mobile_number', mobileNumber);
  }

  async detectSIMCards(): Promise<SIMInfo[]> {
    return this.simDetectionService.detectSIMs();
  }

  formatMobileNumber(number: string): string {
    // Remove any non-digit characters
    const cleaned = number.replace(/\D/g, '');
    
    // Return clean 10-digit number for India
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return cleaned.substring(2);
    } else if (cleaned.length === 10) {
      return cleaned;
    }
    
    return cleaned;
  }

  validateMobileNumber(number: string): boolean {
    const cleaned = number.replace(/\D/g, '');
    
    // Check if it's a valid Indian mobile number (10 digits)
    return cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned);
  }

  async isRegisteredUser(mobileNumber: string): Promise<boolean> {
    try {
      const formattedNumber = this.formatMobileNumber(mobileNumber);
      console.log('Checking if user is registered:', formattedNumber);
      const result = await customAuthService.checkExistingFarmer(formattedNumber);
      console.log('User registration status:', result);
      return result;
    } catch (error) {
      console.error('Error checking user registration:', error);
      return false;
    }
  }

  async authenticateUser(mobileNumber: string): Promise<AuthResult> {
    try {
      const formattedNumber = this.formatMobileNumber(mobileNumber);
      await this.saveMobileNumber(formattedNumber);
      return { success: true, farmer: { id: 'temp_user_id' } };
    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }

  async authenticateWithPin(mobileNumber: string, pin: string): Promise<AuthResult> {
    try {
      const formattedNumber = this.formatMobileNumber(mobileNumber);
      await this.saveMobileNumber(formattedNumber);
      
      const result = await customAuthService.login(formattedNumber, pin);
      
      return {
        success: result.success,
        farmer: result.farmer,
        user_profile: result.user_profile,
        token: result.token,
        error: result.error
      };
    } catch (error) {
      console.error('PIN authentication error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }

  async registerUser(mobileNumber: string, pin: string, userData: any = {}): Promise<AuthResult> {
    try {
      const formattedNumber = this.formatMobileNumber(mobileNumber);
      await this.saveMobileNumber(formattedNumber);
      
      console.log('Registering user with data:', { mobileNumber: formattedNumber, userData });
      
      const result = await customAuthService.register(formattedNumber, pin, userData);
      
      console.log('Registration result:', result);
      
      return {
        success: result.success,
        farmer: result.farmer,
        user_profile: result.user_profile,
        token: result.token,
        error: result.error
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed' };
    }
  }
}
