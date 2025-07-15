
import { Device } from '@capacitor/device';
import { Preferences } from '@capacitor/preferences';

export class MobileNumberService {
  private static instance: MobileNumberService;
  
  static getInstance(): MobileNumberService {
    if (!MobileNumberService.instance) {
      MobileNumberService.instance = new MobileNumberService();
    }
    return MobileNumberService.instance;
  }

  async getMobileNumber(): Promise<string | null> {
    try {
      // First check if we have a cached mobile number
      const { value: cachedNumber } = await Preferences.get({ 
        key: 'userMobileNumber' 
      });
      
      if (cachedNumber) {
        console.log('Using cached mobile number');
        return cachedNumber;
      }

      // Try to get device info for auto-detection (limited on web)
      const deviceInfo = await Device.getInfo();
      console.log('Device info:', deviceInfo);

      // On web/PWA, we cannot access SIM info
      // This would work better in native Capacitor apps
      
      return null;
    } catch (error) {
      console.error('Error getting mobile number:', error);
      return null;
    }
  }

  async saveMobileNumber(mobileNumber: string): Promise<void> {
    await Preferences.set({
      key: 'userMobileNumber',
      value: mobileNumber
    });
  }

  async isRegisteredUser(mobileNumber: string): Promise<boolean> {
    try {
      // Mock implementation - replace with actual Supabase call
      const registeredNumbers = [
        '+919876543210',
        '+919123456789',
        '+918765432109'
      ];
      
      return registeredNumbers.includes(mobileNumber);
    } catch (error) {
      console.error('Error checking registration:', error);
      return false;
    }
  }

  async authenticateUser(mobileNumber: string): Promise<{
    success: boolean;
    token?: string;
    deviceId?: string;
  }> {
    try {
      const deviceInfo = await Device.getId();
      const deviceId = deviceInfo.identifier;

      // Simple hash-based authentication (replace with actual logic)
      const token = `token_${btoa(mobileNumber + deviceId)}_${Date.now()}`;

      await this.saveMobileNumber(mobileNumber);

      return {
        success: true,
        token,
        deviceId
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false };
    }
  }

  formatMobileNumber(number: string): string {
    // Remove all non-digits
    const digits = number.replace(/\D/g, '');
    
    // Add +91 prefix if not present
    if (digits.length === 10) {
      return `+91${digits}`;
    } else if (digits.length === 12 && digits.startsWith('91')) {
      return `+${digits}`;
    } else if (digits.length === 13 && digits.startsWith('91')) {
      return `+${digits}`;
    }
    
    return number;
  }

  validateMobileNumber(number: string): boolean {
    const formatted = this.formatMobileNumber(number);
    const indianMobileRegex = /^\+91[6-9]\d{9}$/;
    return indianMobileRegex.test(formatted);
  }
}
