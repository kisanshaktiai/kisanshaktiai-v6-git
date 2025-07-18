
import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  last_seen_at: string | null;
  tenant_id: string | null;
  role: string | null;
  permissions: Record<string, any>;
  preferences: Record<string, any>;
  aadhaar_number: string | null;
  village: string | null;
  taluka: string | null;
  district: string | null;
  pin_code: string | null;
  farming_experience_years: number | null;
  primary_crops: string[];
  land_size_acres: number | null;
  has_irrigation: boolean | null;
  farming_type: string | null;
  annual_income_range: string | null;
  metadata: Record<string, any>;
  expertise_areas: string[];
  device_tokens: Record<string, any>;
  notification_preferences: Record<string, any>;
}

// For custom auth system, we'll use farmers table instead of profiles
export const fetchProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('farmers')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching farmer profile:', error);
      return null;
    }

    // Map farmer data to Profile interface
    return {
      id: data.id,
      user_id: data.id,
      username: data.farmer_code,
      full_name: data.farmer_code, // Use farmer_code as display name
      email: null,
      avatar_url: null,
      phone: data.mobile_number,
      date_of_birth: null,
      gender: null,
      address_line1: null,
      address_line2: null,
      city: null,
      state: null,
      postal_code: null,
      country: null,
      bio: null,
      created_at: data.created_at,
      updated_at: data.updated_at,
      is_active: true,
      last_seen_at: data.last_login_at,
      tenant_id: data.tenant_id,
      role: 'farmer',
      permissions: {},
      preferences: {},
      aadhaar_number: data.aadhaar_number,
      village: null,
      taluka: null,
      district: null,
      pin_code: null,
      farming_experience_years: data.farming_experience_years,
      primary_crops: data.primary_crops || [],
      land_size_acres: data.total_land_acres,
      has_irrigation: data.has_irrigation,
      farming_type: data.farm_type,
      annual_income_range: data.annual_income_range,
      metadata: {},
      expertise_areas: [],
      device_tokens: {},
      notification_preferences: {}
    } as Profile;
  } catch (error) {
    console.error('Error in fetchProfile:', error);
    return null;
  }
};

export const checkUserExists = async (phone: string): Promise<boolean> => {
  try {
    const cleanPhone = phone.replace(/\D/g, '');
    const { data, error } = await supabase
      .from('farmers')
      .select('id')
      .eq('mobile_number', cleanPhone)
      .single();

    return !error && !!data;
  } catch (error) {
    console.error('Error checking user exists:', error);
    return false;
  }
};

export const updateProfile = async (userId: string, updates: Partial<Profile>): Promise<void> => {
  try {
    // Map profile updates to farmer fields
    const farmerUpdates: any = {};
    
    if (updates.phone) {
      farmerUpdates.mobile_number = updates.phone.replace(/\D/g, '');
    }
    if (updates.farming_experience_years !== undefined) {
      farmerUpdates.farming_experience_years = updates.farming_experience_years;
    }
    if (updates.primary_crops) {
      farmerUpdates.primary_crops = updates.primary_crops;
    }
    if (updates.land_size_acres !== undefined) {
      farmerUpdates.total_land_acres = updates.land_size_acres;
    }
    if (updates.has_irrigation !== undefined) {
      farmerUpdates.has_irrigation = updates.has_irrigation;
    }
    if (updates.farming_type) {
      farmerUpdates.farm_type = updates.farming_type;
    }
    if (updates.annual_income_range) {
      farmerUpdates.annual_income_range = updates.annual_income_range;
    }
    if (updates.aadhaar_number) {
      farmerUpdates.aadhaar_number = updates.aadhaar_number;
    }

    const { error } = await supabase
      .from('farmers')
      .update(farmerUpdates)
      .eq('id', userId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const signInWithPhone = async (phone: string): Promise<void> => {
  // This is a placeholder for SMS-based auth
  // In our custom system, we use PIN-based auth instead
  throw new Error('Use custom PIN-based authentication instead');
};

export const authService = {
  async getProfile(userId: string): Promise<Profile | null> {
    return fetchProfile(userId);
  },

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<boolean> {
    try {
      await updateProfile(userId, updates);
      return true;
    } catch (error) {
      return false;
    }
  },

  async createProfile(profile: Omit<Profile, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    // For custom auth, farmer creation is handled by the register function
    return true;
  }
};
