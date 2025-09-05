import { Preferences } from '@capacitor/preferences';
import { Device } from '@capacitor/device';
import { LocalNotifications } from '@capacitor/local-notifications';

interface BiometricCredentials {
  userId: string;
  encryptedToken: string;
  deviceId: string;
  timestamp: number;
}

export class BiometricAuthService {
  private static instance: BiometricAuthService;
  private readonly BIOMETRIC_KEY = 'biometric_auth_enabled';
  private readonly CREDENTIALS_KEY = 'biometric_credentials';
  private readonly MAX_ATTEMPTS = 3;
  private attempts = 0;

  private constructor() {}

  static getInstance(): BiometricAuthService {
    if (!BiometricAuthService.instance) {
      BiometricAuthService.instance = new BiometricAuthService();
    }
    return BiometricAuthService.instance;
  }

  async checkBiometricAvailability(): Promise<{
    isAvailable: boolean;
    type?: 'fingerprint' | 'face' | 'iris' | 'none';
    reason?: string;
  }> {
    try {
      const deviceInfo = await Device.getInfo();
      
      // Check platform
      if (deviceInfo.platform === 'web') {
        return {
          isAvailable: false,
          type: 'none',
          reason: 'Biometric authentication not available on web'
        };
      }

      // For native platforms, we would integrate with native biometric APIs
      // For now, we'll simulate availability based on device capabilities
      const isAvailable = deviceInfo.platform === 'ios' || deviceInfo.platform === 'android';
      
      return {
        isAvailable,
        type: isAvailable ? 'fingerprint' : 'none',
        reason: isAvailable ? undefined : 'Biometric hardware not found'
      };
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return {
        isAvailable: false,
        type: 'none',
        reason: 'Failed to check biometric availability'
      };
    }
  }

  async enrollBiometric(userId: string, authToken: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const availability = await this.checkBiometricAvailability();
      
      if (!availability.isAvailable) {
        return {
          success: false,
          error: availability.reason || 'Biometric not available'
        };
      }

      // Get device ID for additional security
      const deviceInfo = await Device.getInfo();
      const deviceId = await this.getOrCreateDeviceId();

      // Encrypt the token (in production, use proper encryption)
      const encryptedToken = await this.encryptData(authToken, deviceId);

      // Store credentials securely
      const credentials: BiometricCredentials = {
        userId,
        encryptedToken,
        deviceId,
        timestamp: Date.now()
      };

      await Preferences.set({
        key: this.CREDENTIALS_KEY,
        value: JSON.stringify(credentials)
      });

      await Preferences.set({
        key: this.BIOMETRIC_KEY,
        value: 'true'
      });

      // Show success notification
      await this.showNotification(
        'Biometric Authentication Enabled',
        'You can now use your fingerprint to login'
      );

      return { success: true };
    } catch (error) {
      console.error('Error enrolling biometric:', error);
      return {
        success: false,
        error: 'Failed to enroll biometric authentication'
      };
    }
  }

  async authenticateWithBiometric(): Promise<{
    success: boolean;
    userId?: string;
    token?: string;
    error?: string;
  }> {
    try {
      // Check if biometric is enabled
      const { value: isEnabled } = await Preferences.get({ key: this.BIOMETRIC_KEY });
      
      if (isEnabled !== 'true') {
        return {
          success: false,
          error: 'Biometric authentication not enabled'
        };
      }

      // Check availability
      const availability = await this.checkBiometricAvailability();
      
      if (!availability.isAvailable) {
        return {
          success: false,
          error: availability.reason || 'Biometric not available'
        };
      }

      // Simulate biometric prompt (in production, use native biometric APIs)
      const authenticated = await this.simulateBiometricPrompt();
      
      if (!authenticated) {
        this.attempts++;
        
        if (this.attempts >= this.MAX_ATTEMPTS) {
          await this.handleMaxAttemptsReached();
          return {
            success: false,
            error: 'Maximum attempts exceeded. Please login with phone number.'
          };
        }
        
        return {
          success: false,
          error: `Authentication failed. ${this.MAX_ATTEMPTS - this.attempts} attempts remaining.`
        };
      }

      // Reset attempts on success
      this.attempts = 0;

      // Retrieve stored credentials
      const { value: credentialsJson } = await Preferences.get({ key: this.CREDENTIALS_KEY });
      
      if (!credentialsJson) {
        return {
          success: false,
          error: 'No stored credentials found'
        };
      }

      const credentials: BiometricCredentials = JSON.parse(credentialsJson);
      
      // Verify device ID
      const currentDeviceId = await this.getOrCreateDeviceId();
      
      if (credentials.deviceId !== currentDeviceId) {
        return {
          success: false,
          error: 'Device mismatch. Please re-enroll biometric authentication.'
        };
      }

      // Check credential expiry (30 days)
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      if (Date.now() - credentials.timestamp > thirtyDaysMs) {
        await this.disableBiometric();
        return {
          success: false,
          error: 'Biometric credentials expired. Please login and re-enroll.'
        };
      }

      // Decrypt token
      const token = await this.decryptData(credentials.encryptedToken, currentDeviceId);

      return {
        success: true,
        userId: credentials.userId,
        token
      };
    } catch (error) {
      console.error('Error during biometric authentication:', error);
      return {
        success: false,
        error: 'Authentication failed'
      };
    }
  }

  async disableBiometric(): Promise<void> {
    await Preferences.remove({ key: this.BIOMETRIC_KEY });
    await Preferences.remove({ key: this.CREDENTIALS_KEY });
    this.attempts = 0;
  }

  async isBiometricEnabled(): Promise<boolean> {
    const { value } = await Preferences.get({ key: this.BIOMETRIC_KEY });
    return value === 'true';
  }

  private async getOrCreateDeviceId(): Promise<string> {
    const { value: existingId } = await Preferences.get({ key: 'device_unique_id' });
    
    if (existingId) {
      return existingId;
    }

    const deviceInfo = await Device.getInfo();
    const deviceId = await Device.getId();
    
    // Create a unique device identifier
    const uniqueId = `${deviceInfo.platform}_${deviceId.identifier}_${Date.now()}`;
    
    await Preferences.set({
      key: 'device_unique_id',
      value: uniqueId
    });

    return uniqueId;
  }

  private async encryptData(data: string, key: string): Promise<string> {
    // In production, use proper encryption library
    // This is a simple XOR encryption for demonstration
    const encrypted = btoa(
      data.split('').map((char, i) => 
        String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
      ).join('')
    );
    return encrypted;
  }

  private async decryptData(encryptedData: string, key: string): Promise<string> {
    // In production, use proper decryption library
    const data = atob(encryptedData);
    const decrypted = data.split('').map((char, i) => 
      String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
    ).join('');
    return decrypted;
  }

  private async simulateBiometricPrompt(): Promise<boolean> {
    // In production, this would trigger the native biometric prompt
    // For now, we'll simulate it
    return new Promise((resolve) => {
      // Simulate biometric scan delay
      setTimeout(() => {
        // In real implementation, this would be the result from native biometric API
        resolve(true);
      }, 1000);
    });
  }

  private async handleMaxAttemptsReached(): Promise<void> {
    // Disable biometric for security
    await this.disableBiometric();
    
    // Show notification
    await this.showNotification(
      'Biometric Authentication Disabled',
      'Too many failed attempts. Please login with your phone number and re-enable biometric authentication.'
    );
  }

  private async showNotification(title: string, body: string): Promise<void> {
    try {
      await LocalNotifications.schedule({
        notifications: [{
          id: Date.now(),
          title,
          body,
          smallIcon: 'ic_fingerprint',
          iconColor: '#10b981'
        }]
      });
    } catch (error) {
      console.log('Notification not available:', error);
    }
  }

  async updateStoredToken(newToken: string): Promise<boolean> {
    try {
      const { value: credentialsJson } = await Preferences.get({ key: this.CREDENTIALS_KEY });
      
      if (!credentialsJson) {
        return false;
      }

      const credentials: BiometricCredentials = JSON.parse(credentialsJson);
      const deviceId = await this.getOrCreateDeviceId();
      
      // Re-encrypt with new token
      credentials.encryptedToken = await this.encryptData(newToken, deviceId);
      credentials.timestamp = Date.now();

      await Preferences.set({
        key: this.CREDENTIALS_KEY,
        value: JSON.stringify(credentials)
      });

      return true;
    } catch (error) {
      console.error('Error updating stored token:', error);
      return false;
    }
  }
}

export const biometricAuthService = BiometricAuthService.getInstance();