
import { secureStorage } from '@/services/storage/secureStorage';

export class MobileNumberService {
  private static instance: MobileNumberService;
  private readonly MOBILE_NUMBER_KEY = 'mobile_number';

  private constructor() {}

  public static getInstance(): MobileNumberService {
    if (!MobileNumberService.instance) {
      MobileNumberService.instance = new MobileNumberService();
    }
    return MobileNumberService.instance;
  }

  async getMobileNumber(): Promise<string | null> {
    try {
      const stored = await secureStorage.getItem(this.MOBILE_NUMBER_KEY);
      return stored;
    } catch (error) {
      console.error('Error getting mobile number:', error);
      return null;
    }
  }

  async saveMobileNumber(mobileNumber: string): Promise<void> {
    try {
      await secureStorage.setItem(this.MOBILE_NUMBER_KEY, mobileNumber);
    } catch (error) {
      console.error('Error saving mobile number:', error);
      throw error;
    }
  }

  async removeMobileNumber(): Promise<void> {
    try {
      await secureStorage.removeItem(this.MOBILE_NUMBER_KEY);
    } catch (error) {
      console.error('Error removing mobile number:', error);
      throw error;
    }
  }

  validateMobileNumber(mobileNumber: string): boolean {
    if (!mobileNumber) return false;
    const cleaned = mobileNumber.replace(/\D/g, '');
    return cleaned.length === 10 && /^[6-9]/.test(cleaned);
  }

  formatMobileNumber(mobileNumber: string): string {
    const cleaned = mobileNumber.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }
    return mobileNumber;
  }
}
