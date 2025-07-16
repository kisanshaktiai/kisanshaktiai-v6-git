
import { Device } from '@capacitor/device';
import { Preferences } from '@capacitor/preferences';
import { supabase } from '@/integrations/supabase/client';

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
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('phone', mobileNumber)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking registration:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking registration:', error);
      return false;
    }
  }

  async registerUser(mobileNumber: string, pin: string, userData: {
    fullName: string;
    village?: string;
    district?: string;
    state?: string;
  }): Promise<{
    success: boolean;
    error?: string;
    userId?: string;
  }> {
    try {
      const deviceInfo = await Device.getId();
      const deviceId = deviceInfo.identifier;

      // Create user in Supabase Auth with phone
      const { data: authData, error: authError } = await supabase.auth.signUp({
        phone: mobileNumber,
        password: `${mobileNumber}_${pin}`, // Temporary password
        options: {
          data: {
            phone: mobileNumber,
            full_name: userData.fullName,
            pin_hash: btoa(pin), // Simple encoding for demo
          }
        }
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'User creation failed' };
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          phone: mobileNumber,
          full_name: userData.fullName,
          village: userData.village,
          district: userData.district,
          state: userData.state,
          metadata: {
            pin_hash: btoa(pin),
            device_id: deviceId,
            registration_date: new Date().toISOString()
          }
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        return { success: false, error: 'Profile creation failed' };
      }

      // Create farmer profile
      const { error: farmerError } = await supabase
        .from('farmers')
        .insert({
          id: authData.user.id,
          app_install_date: new Date().toISOString().split('T')[0],
          total_app_opens: 1
        });

      if (farmerError) {
        console.error('Farmer profile creation error:', farmerError);
      }

      await this.saveMobileNumber(mobileNumber);

      return {
        success: true,
        userId: authData.user.id
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed' };
    }
  }

  async authenticateWithPin(mobileNumber: string, pin: string): Promise<{
    success: boolean;
    error?: string;
    userId?: string;
  }> {
    try {
      // Get user profile to verify PIN
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, metadata')
        .eq('phone', mobileNumber)
        .single();

      if (profileError || !profile) {
        return { success: false, error: 'User not found' };
      }

      // Verify PIN
      const storedPinHash = profile.metadata?.pin_hash;
      const providedPinHash = btoa(pin);

      if (storedPinHash !== providedPinHash) {
        return { success: false, error: 'Invalid PIN' };
      }

      // Sign in user
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        phone: mobileNumber,
        password: `${mobileNumber}_${pin}`
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      await this.saveMobileNumber(mobileNumber);

      return {
        success: true,
        userId: authData.user?.id
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, error: 'Authentication failed' };
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
