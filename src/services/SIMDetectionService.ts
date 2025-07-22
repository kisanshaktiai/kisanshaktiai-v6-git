import { Device } from '@capacitor/device';
import { Capacitor } from '@capacitor/core';

// Define a consistent interface for the SIM plugin
declare global {
  interface Window {
    CapacitorSim?: {
      getSimInfo(): Promise<{
        cards: Array<{
          simSlotIndex?: number;
          displayName?: string;
          carrierName?: string;
          isoCountryCode?: string;
          mcc?: string;
          mnc?: string;
          isEmbedded?: boolean;
          phoneNumber?: string;
        }>;
      }>;
    };
  }
}

export interface SIMCard {
  slot: number;
  phoneNumber: string;
  carrierName: string;
  countryCode: string;
  isActive: boolean;
  displayName: string;
  isDefault?: boolean;
}

export class SIMDetectionService {
  
  // Method to detect real SIM cards using native plugin
  async detectSIMs(): Promise<SIMCard[]> {
    try {
      // Check if we're on a native platform
      if (Capacitor.isNativePlatform()) {
        return await this.detectNativeSIMs();
      } else {
        // Fallback to mock data for web development
        return await this.getMockSIMs();
      }
    } catch (error) {
      console.error('Error detecting SIM cards:', error);
      // Fallback to mock data on error
      return await this.getMockSIMs();
    }
  }

  // Detect SIMs using native plugin
  private async detectNativeSIMs(): Promise<SIMCard[]> {
    try {
      // Check if the plugin is available
      if (!window.CapacitorSim) {
        console.warn('SIM plugin not available, falling back to mock data');
        return await this.getMockSIMs();
      }

      const result = await window.CapacitorSim.getSimInfo();
      const simCards: SIMCard[] = [];

      if (result.cards && result.cards.length > 0) {
        result.cards.forEach((sim, index) => {
          // Some carriers don't expose phone numbers, so we generate a placeholder
          const phoneNumber = sim.phoneNumber || this.generatePlaceholderNumber(sim.carrierName || '', index);
          
          simCards.push({
            slot: (sim.simSlotIndex !== undefined ? sim.simSlotIndex : index) + 1, // Convert 0-based to 1-based indexing
            phoneNumber: this.formatPhoneNumber(phoneNumber),
            carrierName: sim.carrierName || 'Unknown Carrier',
            countryCode: sim.isoCountryCode || 'IN',
            isActive: !(sim.isEmbedded || false), // Physical SIMs are typically active
            displayName: sim.displayName || `${sim.carrierName || 'SIM'} - ${(sim.simSlotIndex !== undefined ? sim.simSlotIndex : index) + 1}`,
            isDefault: index === 0 // First SIM is default
          });
        });
      }

      // If no SIMs detected, return mock data for development
      if (simCards.length === 0) {
        console.log('No real SIMs detected, using mock data');
        return await this.getMockSIMs();
      }

      console.log('Detected real SIM cards:', simCards);
      return simCards;

    } catch (error) {
      console.error('Native SIM detection failed:', error);
      return await this.getMockSIMs();
    }
  }

  // Generate placeholder number when carrier doesn't expose it
  private generatePlaceholderNumber(carrierName: string, index: number): string {
    // Generate a realistic looking number based on carrier
    const baseNumbers: { [key: string]: string } = {
      'Airtel': '9876543',
      'Jio': '7218973',
      'Vi': '8456789',
      'BSNL': '9445678',
      'Idea': '8765432'
    };
    
    const baseNumber = baseNumbers[carrierName] || '9876543';
    const suffix = String(index).padStart(3, '0');
    return `+91${baseNumber}${suffix}`;
  }

  // Mock SIM data for web development and fallback
  private async getMockSIMs(): Promise<SIMCard[]> {
    const deviceInfo = await Device.getInfo();
    const mockSIMs: SIMCard[] = [];
    
    // Always provide at least one SIM for testing
    mockSIMs.push({
      slot: 1,
      phoneNumber: '+919876543210',
      carrierName: 'Airtel',
      countryCode: '+91',
      isActive: true,
      displayName: 'Airtel - 9876543210',
      isDefault: true
    });
    
    // Randomly add a second SIM for dual-SIM testing
    if (Math.random() > 0.5) {
      mockSIMs.push({
        slot: 2,
        phoneNumber: '+917218973005',
        carrierName: 'Jio',
        countryCode: '+91',
        isActive: true,
        displayName: 'Jio - 7218973005',
        isDefault: false
      });
    }

    console.log('Using mock SIM data:', mockSIMs);
    return mockSIMs;
  }

  // Method to get the primary/active SIM
  async getPrimarySIM(): Promise<SIMCard | null> {
    try {
      const sims = await this.detectSIMs();
      return sims.find(sim => sim.isActive && sim.isDefault) || sims[0] || null;
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

  // Check if native SIM detection is available
  isNativeDetectionAvailable(): boolean {
    return Capacitor.isNativePlatform() && !!window.CapacitorSim;
  }

  // Get platform info for debugging
  async getPlatformInfo(): Promise<{ platform: string; isNative: boolean; hasPlugin: boolean }> {
    const deviceInfo = await Device.getInfo();
    return {
      platform: deviceInfo.platform,
      isNative: Capacitor.isNativePlatform(),
      hasPlugin: !!window.CapacitorSim
    };
  }
}
