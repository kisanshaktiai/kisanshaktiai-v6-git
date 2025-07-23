
import { customAuthService } from './customAuthService';

export interface SIMInfo {
  slotIndex: number;
  slot: number; // Add slot property for UI compatibility
  carrierName: string;
  countryCode: string;
  mobileCountryCode: string;
  mobileNetworkCode: string;
  phoneNumber?: string;
  isActive: boolean;
  isDefault?: boolean; // Add isDefault property
  displayName?: string; // Add displayName property
}

export class MobileNumberService {
  private static instance: MobileNumberService;

  static getInstance(): MobileNumberService {
    if (!MobileNumberService.instance) {
      MobileNumberService.instance = new MobileNumberService();
    }
    return MobileNumberService.instance;
  }

  formatMobileNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return cleaned.substring(2);
    }
    
    return cleaned;
  }

  validateMobileNumber(phoneNumber: string): boolean {
    const cleaned = this.formatMobileNumber(phoneNumber);
    const isValid = /^[6-9]\d{9}$/.test(cleaned);
    return isValid;
  }

  async detectSIMCards(): Promise<SIMInfo[]> {
    // Mock implementation for SIM card detection
    // In a real app, this would use device APIs
    return [
      {
        slotIndex: 0,
        slot: 1,
        carrierName: 'Airtel',
        countryCode: 'IN',
        mobileCountryCode: '404',
        mobileNetworkCode: '45',
        phoneNumber: '+919876543210',
        isActive: true,
        isDefault: true,
        displayName: 'Airtel - 9876543210'
      },
      {
        slotIndex: 1,
        slot: 2,
        carrierName: 'Jio',
        countryCode: 'IN',
        mobileCountryCode: '404',
        mobileNetworkCode: '07',
        phoneNumber: '+917218973005',
        isActive: true,
        isDefault: false,
        displayName: 'Jio - 7218973005'
      }
    ];
  }

  async checkUserExists(mobileNumber: string): Promise<{ exists: boolean; farmer?: any; profile?: any }> {
    const formatted = this.formatMobileNumber(mobileNumber);
    
    if (!this.validateMobileNumber(formatted)) {
      throw new Error('Invalid mobile number format');
    }

    return await customAuthService.checkExistingUser(formatted);
  }

  async registerNewUser(mobileNumber: string, pin: string, additionalData: any = {}): Promise<any> {
    const formatted = this.formatMobileNumber(mobileNumber);
    
    if (!this.validateMobileNumber(formatted)) {
      throw new Error('Invalid mobile number format');
    }

    return await customAuthService.register(formatted, pin, additionalData);
  }

  async loginUser(mobileNumber: string, pin: string): Promise<any> {
    const formatted = this.formatMobileNumber(mobileNumber);
    
    if (!this.validateMobileNumber(formatted)) {
      throw new Error('Invalid mobile number format');
    }

    return await customAuthService.login(formatted, pin);
  }

  async updateUserProfile(profileData: any): Promise<any> {
    return await customAuthService.updateProfile(profileData);
  }
}

export const mobileNumberService = MobileNumberService.getInstance();
