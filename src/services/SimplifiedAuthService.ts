
import { supabase } from '@/integrations/supabase/client';

type SupportedLanguage = 'hi' | 'en' | 'mr' | 'pa' | 'te' | 'ta' | 'gu' | 'kn' | 'ml' | 'or' | 'bn' | 'ur' | 'ne';

export interface UserProfile {
  id: string;
  mobile_number: string;
  full_name?: string;
  preferred_language?: SupportedLanguage;
  location?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FarmerProfile {
  id: string;
  mobile_number: string;
  full_name?: string;
  farm_size?: number;
  primary_crops?: string[];
  location?: string;
  experience_years?: number;
  tenant_id?: string;
  created_at: string;
  updated_at: string;
}

class SimplifiedAuthService {
  private static instance: SimplifiedAuthService;
  private cachedProfile: UserProfile | null = null;
  private cachedFarmer: FarmerProfile | null = null;

  static getInstance(): SimplifiedAuthService {
    if (!this.instance) {
      this.instance = new SimplifiedAuthService();
    }
    return this.instance;
  }

  async authenticateWithMobile(mobileNumber: string): Promise<{ user: UserProfile; farmer: FarmerProfile }> {
    try {
      // Check if user exists
      const { data: existingUser, error: userError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('mobile_number', mobileNumber)
        .maybeSingle();

      let user: UserProfile;
      let farmer: FarmerProfile;

      if (existingUser) {
        // User exists, update last active
        const { data: updatedUser, error: updateError } = await supabase
          .from('user_profiles')
          .update({ 
            updated_at: new Date().toISOString(),
            is_active: true 
          })
          .eq('id', existingUser.id)
          .select()
          .single();

        if (updateError) throw updateError;
        user = updatedUser as unknown as UserProfile;

        // Get farmer profile
        const { data: farmerData, error: farmerError } = await supabase
          .from('farmers')
          .select('*')
          .eq('mobile_number', mobileNumber)
          .single();

        if (farmerError) throw farmerError;
        farmer = farmerData;
      } else {
        // Create new user
        const userId = crypto.randomUUID();
        const { data: newUser, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: userId,
            mobile_number: mobileNumber,
            full_name: 'User',
            preferred_language: 'hi',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) throw createError;
        user = newUser as unknown as UserProfile;

        // Create farmer profile
        const { data: newFarmer, error: farmerCreateError } = await supabase
          .from('farmers')
          .insert({
            id: userId,
            mobile_number: mobileNumber,
            full_name: 'User',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (farmerCreateError) throw farmerCreateError;
        farmer = newFarmer;
      }

      // Cache the profiles
      this.cachedProfile = user;
      this.cachedFarmer = farmer;

      // Store in localStorage for persistence
      localStorage.setItem('user_profile', JSON.stringify(user));
      localStorage.setItem('farmer_profile', JSON.stringify(farmer));

      return { user, farmer };
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    if (!this.cachedProfile) throw new Error('No user profile cached');

    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', this.cachedProfile.id)
      .select()
      .single();

    if (error) throw error;

    this.cachedProfile = data as unknown as UserProfile;
    localStorage.setItem('user_profile', JSON.stringify(data));

    return data as unknown as UserProfile;
  }

  async updateFarmerProfile(updates: Partial<FarmerProfile>): Promise<FarmerProfile> {
    if (!this.cachedFarmer) throw new Error('No farmer profile cached');

    const { data, error } = await supabase
      .from('farmers')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', this.cachedFarmer.id)
      .select()
      .single();

    if (error) throw error;

    this.cachedFarmer = data;
    localStorage.setItem('farmer_profile', JSON.stringify(data));

    return data;
  }

  getCachedProfile(): UserProfile | null {
    if (this.cachedProfile) return this.cachedProfile;

    const cached = localStorage.getItem('user_profile');
    if (cached) {
      this.cachedProfile = JSON.parse(cached);
      return this.cachedProfile;
    }

    return null;
  }

  getCachedFarmer(): FarmerProfile | null {
    if (this.cachedFarmer) return this.cachedFarmer;

    const cached = localStorage.getItem('farmer_profile');
    if (cached) {
      this.cachedFarmer = JSON.parse(cached);
      return this.cachedFarmer;
    }

    return null;
  }

  async signOut(): Promise<void> {
    this.cachedProfile = null;
    this.cachedFarmer = null;
    localStorage.removeItem('user_profile');
    localStorage.removeItem('farmer_profile');
  }

  isAuthenticated(): boolean {
    return this.getCachedProfile() !== null;
  }
}

export default SimplifiedAuthService;
