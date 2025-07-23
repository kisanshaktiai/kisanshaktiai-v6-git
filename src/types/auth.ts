
import { User, Session } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  mobile_number: string;
  phone_verified: boolean;
  full_name: string | null;
  display_name: string | null;
  farmer_id: string | null;
  preferred_language: string;
  is_profile_complete: boolean;
  tenant_id: string | null;
  created_at: string;
  updated_at: string;
  avatar_url?: string;
  bio?: string;
  village?: string;
  district?: string;
  state?: string;
  country?: string;
  date_of_birth?: string;
  gender?: string;
  farming_experience_years?: number;
  total_land_acres?: number;
  primary_crops?: string[];
  annual_income_range?: string;
  has_irrigation?: boolean;
  irrigation_type?: string;
  has_tractor?: boolean;
  has_storage?: boolean;
  notification_preferences?: any;
  device_tokens?: string[];
  expertise_areas?: string[];
  metadata?: any;
}

export interface UserTenant {
  id: string;
  user_id: string;
  tenant_id: string;
  role: string;
  permissions: string[];
  is_active: boolean;
  joined_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAuthenticated: boolean;
  signInWithPhone: (phone: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  checkUserExists: (phone: string) => Promise<boolean>;
  farmer: any;
  currentAssociation: UserTenant | null;
}
