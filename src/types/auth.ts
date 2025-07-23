export interface Profile {
  id: string;
  phone?: string;
  phone_verified?: boolean;
  full_name?: string;
  display_name?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  address_line1?: string;
  address_line2?: string;
  village?: string;
  taluka?: string;
  district?: string;
  state?: string;
  pincode?: string;
  country?: string;
  avatar_url?: string;
  bio?: string;
  aadhaar_number?: string;
  farmer_id?: string;
  shc_id?: string;
  coordinates?: any;
  last_active_at?: string;
  device_tokens?: string[];
  notification_preferences?: {
    sms: boolean;
    push: boolean;
    email: boolean;
    whatsapp: boolean;
    calls: boolean;
  };
  metadata?: any;
  expertise_areas?: string[];
  preferred_language?: 'en' | 'hi' | 'mr' | 'pa' | 'gu' | 'te' | 'ta' | 'kn' | 'ml' | 'or' | 'bn';
  created_at?: string;
  updated_at?: string;
}

export interface Farmer {
  id: string;
  farmer_code?: string;
  mobile_number?: string;
  tenant_id?: string;
}

export interface AuthContextType {
  user: any | null;
  session: any | null;
  profile: Profile | null;
  loading: boolean;
  isAuthenticated: boolean;
  signInWithPhone: (phone: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  checkUserExists: (phone: string) => Promise<boolean>;
  farmer: Farmer | null;
  currentAssociation: any | null;
}
