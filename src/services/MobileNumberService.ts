
import { customAuthService } from './customAuthService';

export class MobileNumberService {
  private static instance: MobileNumberService;

  static getInstance(): MobileNumberService {
    if (!MobileNumberService.instance) {
      MobileNumberService.instance = new MobileNumberService();
    }
    return MobileNumberService.instance;
  }

  formatMobileNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Remove country code if present
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return cleaned.substring(2);
    }
    
    return cleaned;
  }

  validateMobileNumber(phoneNumber: string): boolean {
    const cleaned = this.formatMobileNumber(phoneNumber);
    
    // Check if it's exactly 10 digits and starts with valid prefixes
    const isValid = /^[6-9]\d{9}$/.test(cleaned);
    return isValid;
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
