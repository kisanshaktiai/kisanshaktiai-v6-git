
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

export const authService = {
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data as Profile;
  },

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<boolean> {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating profile:', error);
      return false;
    }

    return true;
  },

  async createProfile(profile: Omit<Profile, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    const { error } = await supabase
      .from('profiles')
      .insert([profile]);

    if (error) {
      console.error('Error creating profile:', error);
      return false;
    }

    return true;
  }
};
