
import { supabase } from '@/integrations/supabase/client';
import { secureStorage } from './storage/secureStorage';

interface LoginResponse {
  success: boolean;
  token?: string;
  farmer?: {
    id: string;
    farmer_code: string;
    mobile_number: string;
    tenant_id: string | null;
  };
  error?: string;
}

interface RegisterResponse {
  success: boolean;
  token?: string;
  farmer?: {
    id: string;
    farmer_code: string;
    mobile_number: string;
    tenant_id: string | null;
  };
  error?: string;
}

interface StoredFarmer {
  id: string;
  farmer_code: string;
  mobile_number: string;
  tenant_id: string | null;
}

interface OfflineQueueItem {
  action: string;
  data: any;
  timestamp: number;
}

export class CustomAuthService {
  private static instance: CustomAuthService;
  private isOnline: boolean = navigator.onLine;
  private offlineQueue: OfflineQueueItem[] = [];
  
  static getInstance(): CustomAuthService {
    if (!CustomAuthService.instance) {
      CustomAuthService.instance = new CustomAuthService();
    }
    return CustomAuthService.instance;
  }

  constructor() {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processOfflineQueue();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private getStorageKey(key: string): string {
    return `kisanshakti_${key}`;
  }

  private async hashPin(pin: string, mobileNumber: string): Promise<string> {
    const encoder = new TextEncoder();
    const salt = 'kisan_shakti_pin_salt_2024';
    const data = encoder.encode(pin + salt + mobileNumber);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async login(mobileNumber: string, pin: string): Promise<LoginResponse> {
    try {
      // Validate inputs
      if (!mobileNumber || !pin) {
        return {
          success: false,
          error: 'Mobile number and PIN are required'
        };
      }

      // Clean mobile number
      const cleanMobile = mobileNumber.replace(/\D/g, '');
      if (cleanMobile.length !== 10) {
        return {
          success: false,
          error: 'Please enter a valid 10-digit mobile number'
        };
      }

      if (pin.length !== 4) {
        return {
          success: false,
          error: 'PIN must be 4 digits'
        };
      }

      // If offline, check cached credentials
      if (!this.isOnline) {
        return await this.handleOfflineLogin(cleanMobile, pin);
      }

      // Online login via Edge Function
      const { data, error } = await supabase.functions.invoke('custom-auth-login', {
        body: {
          mobile_number: cleanMobile,
          pin: pin
        }
      });

      if (error) {
        console.error('Login error:', error);
        return {
          success: false,
          error: error.message || 'Login failed'
        };
      }

      if (data && data.success && data.token && data.farmer) {
        // Store credentials securely for offline use
        await this.storeCredentials(data.farmer, data.token, pin);
        
        // Set JWT in Supabase client
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.token,
          refresh_token: data.token, // Using same token as refresh for simplicity
          user: {
            id: data.farmer.id,
            email: `${data.farmer.mobile_number}@farmers.local`,
            phone: data.farmer.mobile_number,
            user_metadata: {
              farmer_code: data.farmer.farmer_code,
              tenant_id: data.farmer.tenant_id
            }
          } as any,
          expires_at: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
          expires_in: 24 * 60 * 60,
          token_type: 'bearer'
        } as any);

        if (sessionError) {
          console.warn('Session setup warning:', sessionError);
        }

        return data;
      }

      return {
        success: false,
        error: (data && data.error) || 'Login failed'
      };
    } catch (error) {
      console.error('Login error:', error);
      
      // Fallback to offline login if network error
      if (!this.isOnline || error instanceof TypeError) {
        return await this.handleOfflineLogin(mobileNumber.replace(/\D/g, ''), pin);
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  private async handleOfflineLogin(mobileNumber: string, pin: string): Promise<LoginResponse> {
    try {
      // Get stored credentials
      const storedCredentials = await secureStorage.getObject('farmer_credentials') as StoredFarmer | null;
      const storedPin = await secureStorage.get('farmer_pin_hash');
      
      if (!storedCredentials || !storedPin) {
        return {
          success: false,
          error: 'No offline credentials found. Please connect to internet and login first.'
        };
      }

      // Verify mobile number matches
      if (storedCredentials.mobile_number !== mobileNumber) {
        return {
          success: false,
          error: 'Mobile number does not match stored credentials'
        };
      }

      // Verify PIN
      const pinHash = await this.hashPin(pin, mobileNumber);
      if (pinHash !== storedPin) {
        return {
          success: false,
          error: 'Invalid PIN'
        };
      }

      // Create offline session
      const offlineToken = `offline_${Date.now()}_${mobileNumber}`;
      await secureStorage.set('auth_token', offlineToken);
      await secureStorage.setObject('farmer_data', storedCredentials);

      return {
        success: true,
        token: offlineToken,
        farmer: storedCredentials
      };
    } catch (error) {
      console.error('Offline login error:', error);
      return {
        success: false,
        error: 'Offline login failed'
      };
    }
  }

  private async storeCredentials(farmer: StoredFarmer, token: string, pin: string): Promise<void> {
    try {
      const pinHash = await this.hashPin(pin, farmer.mobile_number);
      
      await secureStorage.setObject('farmer_credentials', farmer);
      await secureStorage.set('farmer_pin_hash', pinHash);
      await secureStorage.set('auth_token', token);
      await secureStorage.setObject('farmer_data', farmer);
      await secureStorage.set('last_login', new Date().toISOString());
    } catch (error) {
      console.error('Error storing credentials:', error);
    }
  }

  async register(mobileNumber: string, pin: string, farmerData?: any): Promise<RegisterResponse> {
    try {
      // Validate inputs
      if (!mobileNumber || !pin) {
        return {
          success: false,
          error: 'Mobile number and PIN are required'
        };
      }

      const cleanMobile = mobileNumber.replace(/\D/g, '');
      if (cleanMobile.length !== 10) {
        return {
          success: false,
          error: 'Please enter a valid 10-digit mobile number'
        };
      }

      if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        return {
          success: false,
          error: 'PIN must be exactly 4 digits'
        };
      }

      // If offline, queue for later
      if (!this.isOnline) {
        await this.queueOfflineAction('register', { mobileNumber: cleanMobile, pin, farmerData });
        return {
          success: false,
          error: 'Registration requires internet connection. Request queued for when online.'
        };
      }

      const { data, error } = await supabase.functions.invoke('custom-auth-register', {
        body: {
          mobile_number: cleanMobile,
          pin: pin,
          farmer_data: farmerData || {}
        }
      });

      if (error) {
        return {
          success: false,
          error: error.message || 'Registration failed'
        };
      }

      if (data && data.success && data.token && data.farmer) {
        // Store credentials for offline use
        await this.storeCredentials(data.farmer, data.token, pin);
        
        // Set session
        await supabase.auth.setSession({
          access_token: data.token,
          refresh_token: data.token,
          user: {
            id: data.farmer.id,
            email: `${data.farmer.mobile_number}@farmers.local`,
            phone: data.farmer.mobile_number,
            user_metadata: {
              farmer_code: data.farmer.farmer_code,
              tenant_id: data.farmer.tenant_id
            }
          } as any,
          expires_at: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
          expires_in: 24 * 60 * 60,
          token_type: 'bearer'
        } as any);

        return data;
      }

      return {
        success: false,
        error: (data && data.error) || 'Registration failed'
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  }

  private async queueOfflineAction(action: string, data: any): Promise<void> {
    const queueItem: OfflineQueueItem = {
      action,
      data,
      timestamp: Date.now()
    };
    
    this.offlineQueue.push(queueItem);
    await secureStorage.setObject('offline_queue', this.offlineQueue);
  }

  private async processOfflineQueue(): Promise<void> {
    try {
      const queue = await secureStorage.getObject('offline_queue') as OfflineQueueItem[] || [];
      this.offlineQueue = queue;

      for (const item of this.offlineQueue) {
        try {
          if (item.action === 'register') {
            await this.register(item.data.mobileNumber, item.data.pin, item.data.farmerData);
          }
        } catch (error) {
          console.error('Error processing queued action:', error);
        }
      }

      // Clear processed queue
      this.offlineQueue = [];
      await secureStorage.remove('offline_queue');
    } catch (error) {
      console.error('Error processing offline queue:', error);
    }
  }

  async checkExistingFarmer(mobileNumber: string): Promise<boolean> {
    try {
      const cleanMobile = mobileNumber.replace(/\D/g, '');
      
      // If offline, check local storage
      if (!this.isOnline) {
        const storedCredentials = await secureStorage.getObject('farmer_credentials') as StoredFarmer | null;
        return storedCredentials?.mobile_number === cleanMobile;
      }

      const { data, error } = await supabase
        .from('farmers')
        .select('id')
        .eq('mobile_number', cleanMobile)
        .single();

      return !error && !!data;
    } catch (error) {
      console.error('Check existing farmer error:', error);
      return false;
    }
  }

  getCurrentFarmer(): StoredFarmer | null {
    // Try to get from memory first, then storage
    return this.getCurrentFarmerSync();
  }

  private getCurrentFarmerSync(): StoredFarmer | null {
    try {
      const farmerData = localStorage.getItem(this.getStorageKey('farmer_data'));
      return farmerData ? JSON.parse(farmerData) : null;
    } catch (error) {
      console.error('Error getting current farmer:', error);
      return null;
    }
  }

  getCurrentToken(): string | null {
    try {
      return localStorage.getItem(this.getStorageKey('auth_token'));
    } catch (error) {
      console.error('Error getting current token:', error);
      return null;
    }
  }

  isAuthenticated(): boolean {
    const token = this.getCurrentToken();
    const farmer = this.getCurrentFarmer();
    return !!(token && farmer);
  }

  async signOut(): Promise<void> {
    try {
      // Clear all stored data
      await secureStorage.remove('farmer_credentials');
      await secureStorage.remove('farmer_pin_hash');
      await secureStorage.remove('auth_token');
      await secureStorage.remove('farmer_data');
      await secureStorage.remove('last_login');
      await secureStorage.remove('offline_queue');
      
      // Clear localStorage as fallback
      localStorage.removeItem(this.getStorageKey('auth_token'));
      localStorage.removeItem(this.getStorageKey('farmer_data'));
      
      // Clear Supabase session
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  async restoreSession(): Promise<boolean> {
    try {
      const token = this.getCurrentToken();
      const farmer = this.getCurrentFarmer();

      if (!token || !farmer) {
        return false;
      }

      // Check if it's an offline token
      if (token.startsWith('offline_')) {
        // For offline tokens, just validate they're not too old
        const lastLogin = await secureStorage.get('last_login');
        if (lastLogin) {
          const lastLoginDate = new Date(lastLogin);
          const daysSinceLogin = (Date.now() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24);
          
          // Allow offline sessions for up to 7 days
          if (daysSinceLogin > 7) {
            await this.signOut();
            return false;
          }
        }
        return true;
      }

      // For online tokens, try to set session with Supabase
      const { error } = await supabase.auth.setSession({
        access_token: token,
        refresh_token: token,
        user: {
          id: farmer.id,
          email: `${farmer.mobile_number}@farmers.local`,
          phone: farmer.mobile_number,
          user_metadata: {
            farmer_code: farmer.farmer_code,
            tenant_id: farmer.tenant_id
          }
        } as any,
        expires_at: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
        expires_in: 24 * 60 * 60,
        token_type: 'bearer'
      } as any);

      if (error) {
        console.warn('Session restoration warning:', error);
        // Don't fail completely, allow offline mode
        return true;
      }

      return true;
    } catch (error) {
      console.error('Error restoring session:', error);
      return false;
    }
  }
}

export const customAuthService = CustomAuthService.getInstance();
