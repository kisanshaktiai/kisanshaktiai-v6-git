/**
 * Simplified Farmer Authentication Service
 * Only uses farmers table, no auth.users dependency
 */

interface FarmerSession {
  token: string;
  farmer_id: string;
  tenant_id: string;
  mobile_number: string;
  expires_at: string;
}

interface AuthResult {
  success: boolean;
  farmer?: any;
  profile?: any;
  session?: FarmerSession;
  error?: string;
  isNewUser?: boolean;
}

export class SimpleFarmerAuthService {
  private static instance: SimpleFarmerAuthService;
  private session: FarmerSession | null = null;
  private readonly SESSION_KEY = 'farmer_session';
  private readonly SUPABASE_URL = 'https://qfklkkzxemsbeniyugiz.supabase.co';
  private readonly SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFma2xra3p4ZW1zYmVuaXl1Z2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MjcxNjUsImV4cCI6MjA2ODAwMzE2NX0.dUnGp7wbwYom1FPbn_4EGf3PWjgmr8mXwL2w2SdYOh4';

  private constructor() {
    this.loadSession();
  }

  public static getInstance(): SimpleFarmerAuthService {
    if (!SimpleFarmerAuthService.instance) {
      SimpleFarmerAuthService.instance = new SimpleFarmerAuthService();
    }
    return SimpleFarmerAuthService.instance;
  }

  /**
   * Check if farmer exists by mobile number
   */
  async checkFarmerExists(mobileNumber: string): Promise<boolean> {
    try {
      const cleanMobile = this.cleanMobileNumber(mobileNumber);
      
      const response = await fetch(`${this.SUPABASE_URL}/functions/v1/farmer-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          action: 'check_exists',
          mobile_number: cleanMobile
        })
      });

      const data = await response.json();
      return data.exists || false;
    } catch (error) {
      console.error('Error checking farmer existence:', error);
      return false;
    }
  }

  /**
   * Login farmer with mobile number and PIN
   */
  async login(mobileNumber: string, pin: string): Promise<AuthResult> {
    try {
      const cleanMobile = this.cleanMobileNumber(mobileNumber);
      
      if (!this.validateMobileNumber(cleanMobile)) {
        return {
          success: false,
          error: 'Invalid mobile number format'
        };
      }

      if (!this.validatePin(pin)) {
        return {
          success: false,
          error: 'PIN must be 4 digits'
        };
      }

      const response = await fetch(`${this.SUPABASE_URL}/functions/v1/farmer-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          action: 'login',
          mobile_number: cleanMobile,
          pin: pin
        })
      });

      const data = await response.json();

      if (data.success) {
        this.session = data.session;
        this.saveSession();
        return {
          success: true,
          farmer: data.farmer,
          profile: data.profile,
          session: data.session,
          isNewUser: false
        };
      }

      return {
        success: false,
        error: data.error || 'Login failed'
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Connection error. Please try again.'
      };
    }
  }

  /**
   * Register new farmer
   */
  async register(
    mobileNumber: string,
    pin: string,
    farmerData: {
      full_name: string;
      tenant_id?: string;
      state?: string;
      district?: string;
      village?: string;
      preferred_language?: string;
      coordinates?: any;
    }
  ): Promise<AuthResult> {
    try {
      const cleanMobile = this.cleanMobileNumber(mobileNumber);
      
      if (!this.validateMobileNumber(cleanMobile)) {
        return {
          success: false,
          error: 'Invalid mobile number format'
        };
      }

      if (!this.validatePin(pin)) {
        return {
          success: false,
          error: 'PIN must be 4 digits'
        };
      }

      const response = await fetch(`${this.SUPABASE_URL}/functions/v1/farmer-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          action: 'register',
          mobile_number: cleanMobile,
          pin: pin,
          farmer_data: farmerData
        })
      });

      const data = await response.json();

      if (data.success) {
        this.session = data.session;
        this.saveSession();
        return {
          success: true,
          farmer: data.farmer,
          profile: data.profile,
          session: data.session,
          isNewUser: true
        };
      }

      return {
        success: false,
        error: data.error || 'Registration failed'
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Connection error. Please try again.'
      };
    }
  }

  /**
   * Update farmer PIN
   */
  async updatePin(mobileNumber: string, oldPin: string, newPin: string): Promise<AuthResult> {
    try {
      const cleanMobile = this.cleanMobileNumber(mobileNumber);
      
      if (!this.validatePin(newPin)) {
        return {
          success: false,
          error: 'New PIN must be 4 digits'
        };
      }

      const response = await fetch(`${this.SUPABASE_URL}/functions/v1/farmer-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          action: 'update_pin',
          mobile_number: cleanMobile,
          farmer_data: {
            old_pin: oldPin,
            new_pin: newPin
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        return { success: true };
      }

      return {
        success: false,
        error: data.error || 'Failed to update PIN'
      };
    } catch (error) {
      console.error('Update PIN error:', error);
      return {
        success: false,
        error: 'Connection error. Please try again.'
      };
    }
  }

  /**
   * Get current session
   */
  getSession(): FarmerSession | null {
    if (!this.session) {
      return null;
    }

    // Check if session is expired
    if (new Date(this.session.expires_at) < new Date()) {
      this.clearSession();
      return null;
    }

    return this.session;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.getSession() !== null;
  }

  /**
   * Sign out
   */
  signOut(): void {
    this.clearSession();
  }

  /**
   * Utility: Clean mobile number
   */
  private cleanMobileNumber(mobile: string): string {
    return mobile.replace(/\D/g, '');
  }

  /**
   * Utility: Validate mobile number (Indian format)
   */
  private validateMobileNumber(mobile: string): boolean {
    return /^[6-9]\d{9}$/.test(mobile);
  }

  /**
   * Utility: Validate PIN (4 digits)
   */
  private validatePin(pin: string): boolean {
    return /^\d{4}$/.test(pin);
  }

  /**
   * Save session to localStorage
   */
  private saveSession(): void {
    if (this.session) {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(this.session));
    }
  }

  /**
   * Load session from localStorage
   */
  private loadSession(): void {
    try {
      const stored = localStorage.getItem(this.SESSION_KEY);
      if (stored) {
        this.session = JSON.parse(stored);
        // Validate expiry
        if (this.session && new Date(this.session.expires_at) < new Date()) {
          this.clearSession();
        }
      }
    } catch (error) {
      console.error('Error loading session:', error);
      this.clearSession();
    }
  }

  /**
   * Clear session
   */
  private clearSession(): void {
    this.session = null;
    localStorage.removeItem(this.SESSION_KEY);
  }
}

// Export singleton instance
export const simpleFarmerAuth = SimpleFarmerAuthService.getInstance();