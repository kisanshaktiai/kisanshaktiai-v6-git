
import { Device } from '@capacitor/device';

export interface SIMCard {
  slot: number;
  phoneNumber: string;
  carrierName: string;
  countryCode: string;
  isActive: boolean;
  displayName: string;
}

export class SIMDetectionService {
  
  // Method to detect SIM cards (mock implementation for web/testing)
  async detectSIMs(): Promise<SIMCard[]> {
    try {
      // Get device info for mock data
      const deviceInfo = await Device.getInfo();
      
      // Mock SIM data for testing - in a real app this would use native plugins
      const mockSIMs: SIMCard[] = [];
      
      // Simulate different scenarios based on platform
      if (deviceInfo.platform === 'web') {
        // Web environment - return mock data for testing
        mockSIMs.push({
          slot: 1,
          phoneNumber: '+919876543210',
          carrierName: 'Airtel',
          countryCode: '+91',
          isActive: true,
          displayName: 'Airtel - 9876543210'
        });
        
        // Optionally add a second SIM for testing multi-SIM scenarios
        if (Math.random() > 0.5) {
          mockSIMs.push({
            slot: 2,
            phoneNumber: '+917218973005',
            carrierName: 'Jio',
            countryCode: '+91',
            isActive: true,
            displayName: 'Jio - 7218973005'
          });
        }
      } else {
        // Native environment - would use actual device APIs
        // For now, return mock data similar to web
        mockSIMs.push({
          slot: 1,
          phoneNumber: '+919876543210',
          carrierName: 'Airtel',
          countryCode: '+91',
          isActive: true,
          displayName: 'Airtel - 9876543210'
        });
      }
      
      console.log('Detected SIM cards:', mockSIMs);
      return mockSIMs;
      
    } catch (error) {
      console.error('Error detecting SIM cards:', error);
      return [];
    }
  }

  // Method to get the primary/active SIM
  async getPrimarySIM(): Promise<SIMCard | null> {
    try {
      const sims = await this.detectSIMs();
      return sims.find(sim => sim.isActive && sim.slot === 1) || sims[0] || null;
    } catch (error) {
      console.error('Error getting primary SIM:', error);
      return null;
    }
  }

  // Method to format phone number from SIM
  formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-digit characters except +
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Ensure it starts with +91 for Indian numbers
    if (cleaned.startsWith('91') && !cleaned.startsWith('+91')) {
      return `+${cleaned}`;
    } else if (!cleaned.startsWith('+91') && cleaned.length === 10) {
      return `+91${cleaned}`;
    }
    
    return cleaned;
  }
}
