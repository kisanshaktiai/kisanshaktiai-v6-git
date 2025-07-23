
import { User, Session } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  mobile_number: string; // Changed from phone to mobile_number
  phone_verified: boolean;
  full_name: string | null;
  display_name: string | null;
  farmer_id?: string | null;
  preferred_language: string | null;
  is_profile_complete: boolean;
  tenant_id: string | null;
  created_at: string;
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
  farmer?: any;
  currentAssociation?: any;
}

export interface FarmerAssociation {
  id: string;
  farmer_id: string;
  tenant_id: string;
  role: string;
  is_active: boolean;
  joined_at: string;
  tenant?: {
    id: string;
    name: string;
    slug: string;
  };
}
