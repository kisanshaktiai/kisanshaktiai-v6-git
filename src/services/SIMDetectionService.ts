
import { Device } from '@capacitor/device';
import { Capacitor } from '@capacitor/core';

interface SIMInfo {
  slot: number;
  phoneNumber: string;
  carrierName: string;
  countryCode: string;
  isDefault?: boolean;
}

export class SIMDetectionService {
  private static instance: SIMDetectionService;

  public static getInstance(): SIMDetectionService {
    if (!SIMDetectionService.instance) {
      SIMDetectionService.instance = new SIMDetectionService();
    }
    return SIMDetectionService.instance;
  }

  async detectSIMCards(): Promise<SIMInfo[]> {
    if (!Capacitor.isNativePlatform()) {
      console.log('SIM detection only available on native platforms');
      return [];
    }

    try {
      const deviceInfo = await Device.getInfo();
      console.log('Device platform:', deviceInfo.platform);

      // This is a placeholder implementation
      // In a real app, you would use native plugins like:
      // - @ionic-native/sim for Ionic
      // - Custom Capacitor plugin for SIM access
      // - Platform-specific implementations

      // Simulated SIM data for development/testing
      if (deviceInfo.platform === 'android' || deviceInfo.platform === 'ios') {
        return this.getMockSIMData();
      }

      return [];
    } catch (error) {
      console.error('Error detecting SIM cards:', error);
      return [];
    }
  }

  private getMockSIMData(): SIMInfo[] {
    // Mock data for testing - replace with actual native plugin calls
    const mockSIMs: SIMInfo[] = [
      {
        slot: 1,
        phoneNumber: '+919876543210',
        carrierName: 'Airtel',
        countryCode: 'IN',
        isDefault: true
      },
      {
        slot: 2,
        phoneNumber: '+919123456789',
        carrierName: 'Jio',
        countryCode: 'IN',
        isDefault: false
      }
    ];

    // Randomly return 1 or 2 SIMs for testing
    const numSIMs = Math.random() > 0.5 ? 1 : 2;
    return mockSIMs.slice(0, numSIMs);
  }

  async getDefaultSIM(): Promise<SIMInfo | null> {
    const sims = await this.detectSIMCards();
    return sims.find(sim => sim.isDefault) || sims[0] || null;
  }

  formatPhoneNumber(phoneNumber: string, countryCode: string = 'IN'): string {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Handle Indian numbers specifically
    if (countryCode === 'IN') {
      if (cleaned.length === 10) {
        return `+91${cleaned}`;
      } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
        return `+${cleaned}`;
      } else if (cleaned.length === 13 && cleaned.startsWith('+91')) {
        return cleaned;
      }
      return `+91${cleaned.slice(-10)}`;
    }
    
    // For other countries, add appropriate country codes
    return phoneNumber;
  }

  validatePhoneNumber(phoneNumber: string): boolean {
    const cleaned = phoneNumber.replace(/\D/g, '');
    // Indian mobile numbers: 10 digits starting with 6,7,8,9
    return /^[6-9]\d{9}$/.test(cleaned.slice(-10));
  }
}
