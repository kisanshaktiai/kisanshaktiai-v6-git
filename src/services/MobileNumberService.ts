
import { Capacitor } from '@capacitor/core';
import { SimPlugin, SimCard } from '@jonz94/capacitor-sim';
import { DEFAULT_TENANT_ID } from '@/config/constants';
import { customAuthService } from './customAuthService';
import { supabase } from '@/integrations/supabase/client';

export interface SIMInfo {
  phoneNumber: string;
  carrierName: string;
  countryCode: string;
  displayName: string;
  simSlotIndex: number;
  isEsim: boolean;
  // Add missing properties
  slot: number;
  isDefault: boolean;
  isActive: boolean;
}

export interface AuthResult {
  success: boolean;
  userId?: string;
  error?: string;
}

export class MobileNumberService {
  private static instance: MobileNumberService;
  private cachedMobileNumber: string | null = null;

  private constructor() {
    // Private constructor to enforce singleton
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
    if (!Capacitor.isNativePlatform()) {
      return []; // Not supported in web
    }

    try {
      if (!SimPlugin) {
        console.warn('SIM Plugin not available');
        return [];
      }

      const result = await SimPlugin.getSimInfo();
      if (!result.cards || result.cards.length === 0) {
        return [];
      }

      return result.cards.map((card: SimCard, index: number) => ({
        phoneNumber: card.phoneNumber || '',
        carrierName: card.carrierName || '',
        countryCode: card.countryCode || 'IN',
        displayName: card.displayName || `SIM ${index + 1}`,
        simSlotIndex: card.simSlotIndex || index,
        isEsim: card.isEsim || false,
        // Add additional properties required by other components
        slot: index + 1,
        isDefault: index === 0, // Assuming first SIM is default
        isActive: true // Assuming all detected SIMs are active
      }));
    } catch (error) {
      console.error('Error accessing SIM information:', error);
      return [];
    }
  }

  formatMobileNumber(number: string): string {
    // Remove any non-digit characters
    const cleaned = number.replace(/\D/g, '');
    
    // Add India country code if not present
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return `+${cleaned}`;
    } else if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }
    
    // Handle other cases
    return number.startsWith('+') ? number : `+${number}`;
  }

  validateMobileNumber(number: string): boolean {
    const cleaned = number.replace(/\D/g, '');
    
    // Check if it's a valid Indian mobile number
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return true;
    } else if (cleaned.length === 10) {
      return true;
    }
    
    return false;
  }

  async isRegisteredUser(mobileNumber: string): Promise<boolean> {
    const formattedNumber = this.formatMobileNumber(mobileNumber);
    return customAuthService.checkExistingFarmer(formattedNumber);
  }

  async authenticateUser(mobileNumber: string): Promise<AuthResult> {
    try {
      // This is a simple method for basic authentication flow
      // It doesn't actually authenticate the user but marks them as authenticated
      // for flows where PIN verification isn't required
      const formattedNumber = this.formatMobileNumber(mobileNumber);
      await this.saveMobileNumber(formattedNumber);
      return { success: true, userId: 'temp_user_id' };
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
        userId: result.userId,
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
      
      // Use tenant_id from constants if not provided
      userData.tenant_id = userData.tenant_id || DEFAULT_TENANT_ID;
      
      const result = await customAuthService.register(formattedNumber, pin, userData);
      
      return {
        success: result.success,
        userId: result.userId,
        error: result.error
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed' };
    }
  }
}
