
import { supabase } from '@/integrations/supabase/client';

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

interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  timezone: string;
  screenSize: string;
}

export class CustomAuthService {
  private static instance: CustomAuthService;
  private inactivityTimer: NodeJS.Timeout | null = null;
  private readonly INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  
  static getInstance(): CustomAuthService {
    if (!CustomAuthService.instance) {
      CustomAuthService.instance = new CustomAuthService();
    }
    return CustomAuthService.instance;
  }

  private getStorageKey(key: string): string {
    return `kisanshakti_${key}`;
  }

  private generateDeviceFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx!.textBaseline = 'top';
    ctx!.font = '14px Arial';
    ctx!.fillText('Device fingerprint', 2, 2);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    return btoa(fingerprint).substring(0, 32);
  }

  private getDeviceInfo(): DeviceInfo {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenSize: `${screen.width}x${screen.height}`
    };
  }

  private validatePinComplexity(pin: string): { isValid: boolean; message: string } {
    if (pin.length !== 4) {
      return { isValid: false, message: 'PIN must be exactly 4 digits' };
    }

    // Check for weak patterns
    const weakPatterns = [
      '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999',
      '1234', '4321', '2468', '8642', '1357', '9753'
    ];

    if (weakPatterns.includes(pin)) {
      return { isValid: false, message: 'PIN is too simple. Please choose a stronger PIN.' };
    }

    // Check for sequential patterns
    let sequential = true;
    for (let i = 1; i < pin.length; i++) {
      if (parseInt(pin[i]) !== parseInt(pin[i-1]) + 1) {
        sequential = false;
        break;
      }
    }

    if (sequential) {
      return { isValid: false, message: 'PIN cannot be sequential numbers.' };
    }

    return { isValid: true, message: 'PIN is strong' };
  }

  private setupInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }

    this.inactivityTimer = setTimeout(() => {
      this.signOut();
    }, this.INACTIVITY_TIMEOUT);
  }

  private resetInactivityTimer(): void {
    if (this.getCurrentToken()) {
      this.setupInactivityTimer();
    }
  }

  async login(mobileNumber: string, pin: string): Promise<LoginResponse> {
    try {
      // Clean mobile number
      const cleanMobile = mobileNumber.replace(/\D/g, '');
      
      if (cleanMobile.length !== 10) {
        return {
          success: false,
          error: 'Please enter a valid 10-digit mobile number'
        };
      }

      const { data, error } = await supabase.functions.invoke('custom-auth-login', {
        body: {
          mobile_number: cleanMobile,
          pin: pin,
          device_info: this.getDeviceInfo(),
          device_fingerprint: this.generateDeviceFingerprint()
        }
      });

      if (error) {
        throw new Error(error.message || 'Login failed');
      }

      if (data.success && data.token) {
        // Store token securely
        localStorage.setItem(this.getStorageKey('auth_token'), data.token);
        localStorage.setItem(this.getStorageKey('farmer_data'), JSON.stringify(data.farmer));
        localStorage.setItem(this.getStorageKey('device_fingerprint'), this.generateDeviceFingerprint());
        localStorage.setItem(this.getStorageKey('last_activity'), Date.now().toString());
        
        // Setup inactivity monitoring
        this.setupInactivityTimer();
        
        // Add activity listeners
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
          document.addEventListener(event, () => this.resetInactivityTimer(), true);
        });

        // Set JWT in Supabase client for RLS
        supabase.auth.setSession({
          access_token: data.token,
          refresh_token: '',
          user: null,
          expires_at: Date.now() / 1000 + 24 * 60 * 60,
          expires_in: 24 * 60 * 60,
          token_type: 'bearer'
        } as any);
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  async register(mobileNumber: string, pin: string, farmerData?: any): Promise<RegisterResponse> {
    try {
      // Clean mobile number
      const cleanMobile = mobileNumber.replace(/\D/g, '');
      
      if (cleanMobile.length !== 10) {
        return {
          success: false,
          error: 'Please enter a valid 10-digit mobile number'
        };
      }

      // Validate PIN complexity
      const pinValidation = this.validatePinComplexity(pin);
      if (!pinValidation.isValid) {
        return {
          success: false,
          error: pinValidation.message
        };
      }

      const { data, error } = await supabase.functions.invoke('custom-auth-register', {
        body: {
          mobile_number: cleanMobile,
          pin: pin,
          farmer_data: farmerData || {},
          device_info: this.getDeviceInfo(),
          device_fingerprint: this.generateDeviceFingerprint()
        }
      });

      if (error) {
        throw new Error(error.message || 'Registration failed');
      }

      if (data.success && data.token) {
        // Store token securely
        localStorage.setItem(this.getStorageKey('auth_token'), data.token);
        localStorage.setItem(this.getStorageKey('farmer_data'), JSON.stringify(data.farmer));
        localStorage.setItem(this.getStorageKey('device_fingerprint'), this.generateDeviceFingerprint());
        localStorage.setItem(this.getStorageKey('last_activity'), Date.now().toString());
        
        // Setup inactivity monitoring
        this.setupInactivityTimer();
        
        // Add activity listeners
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
          document.addEventListener(event, () => this.resetInactivityTimer(), true);
        });

        // Set JWT in Supabase client for RLS
        supabase.auth.setSession({
          access_token: data.token,
          refresh_token: '',
          user: null,
          expires_at: Date.now() / 1000 + 24 * 60 * 60,
          expires_in: 24 * 60 * 60,
          token_type: 'bearer'
        } as any);
      }

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  }

  async checkExistingFarmer(mobileNumber: string): Promise<boolean> {
    try {
      const cleanMobile = mobileNumber.replace(/\D/g, '');
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

  getCurrentFarmer(): any | null {
    try {
      const farmerData = localStorage.getItem(this.getStorageKey('farmer_data'));
      return farmerData ? JSON.parse(farmerData) : null;
    } catch (error) {
      console.error('Error getting current farmer:', error);
      return null;
    }
  }

  getCurrentToken(): string | null {
    return localStorage.getItem(this.getStorageKey('auth_token'));
  }

  isAuthenticated(): boolean {
    const token = this.getCurrentToken();
    const farmer = this.getCurrentFarmer();
    const lastActivity = localStorage.getItem(this.getStorageKey('last_activity'));
    
    if (!token || !farmer || !lastActivity) {
      return false;
    }

    // Check if session has expired due to inactivity
    const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
    if (timeSinceLastActivity > this.INACTIVITY_TIMEOUT) {
      this.signOut();
      return false;
    }

    return true;
  }

  async signOut(): Promise<void> {
    // Clear inactivity timer
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }

    // Remove activity listeners
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.removeEventListener(event, () => this.resetInactivityTimer(), true);
    });

    // Clear stored data
    localStorage.removeItem(this.getStorageKey('auth_token'));
    localStorage.removeItem(this.getStorageKey('farmer_data'));
    localStorage.removeItem(this.getStorageKey('device_fingerprint'));
    localStorage.removeItem(this.getStorageKey('last_activity'));
    
    // Clear Supabase session
    await supabase.auth.signOut();
  }

  async restoreSession(): Promise<boolean> {
    try {
      const token = this.getCurrentToken();
      const farmer = this.getCurrentFarmer();

      if (token && farmer && this.isAuthenticated()) {
        // Set JWT in Supabase client for RLS
        supabase.auth.setSession({
          access_token: token,
          refresh_token: '',
          user: null,
          expires_at: Date.now() / 1000 + 24 * 60 * 60,
          expires_in: 24 * 60 * 60,
          token_type: 'bearer'
        } as any);
        
        // Setup inactivity monitoring
        this.setupInactivityTimer();
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error restoring session:', error);
      return false;
    }
  }

  // Method to detect SIM information (mobile-first feature)
  async detectSIMInfo(): Promise<{ number?: string; carrier?: string }> {
    try {
      // This is a placeholder for actual SIM detection
      // In a real mobile app, you'd use Capacitor plugins
      return {};
    } catch (error) {
      console.error('SIM detection error:', error);
      return {};
    }
  }

  // Check if device supports biometric authentication
  async isBiometricAvailable(): Promise<boolean> {
    try {
      // Check for WebAuthn support (for biometric auth)
      return !!(navigator.credentials && window.PublicKeyCredential);
    } catch (error) {
      return false;
    }
  }
}

export const customAuthService = CustomAuthService.getInstance();
