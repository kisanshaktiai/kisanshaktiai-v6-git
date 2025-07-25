
export interface Profile {
  id: string;
  mobile_number: string; // Changed from phone to mobile_number
  phone_verified?: boolean;
  full_name?: string;
  display_name?: string;
  date_of_birth?: string;
  gender?: string;
  address_line1?: string;
  address_line2?: string;
  village?: string;
  taluka?: string;
  district?: string;
  state?: string;
  pincode?: string;
  country?: string;
  coordinates?: any;
  preferred_language?: 'en' | 'hi' | 'mr' | 'pa' | 'gu' | 'te' | 'ta' | 'kn' | 'ml' | 'or' | 'bn' | 'ur' | 'ne';
  notification_preferences?: {
    sms: boolean;
    push: boolean;
    email: boolean;
    whatsapp: boolean;
    calls: boolean;
  };
  avatar_url?: string;
  bio?: string;
  expertise_areas?: string[];
  device_tokens?: string[];
  last_active_at?: string;
  metadata?: any;
  aadhaar_number?: string;
  farmer_id?: string;
  shc_id?: string;
  created_at?: string;
  updated_at?: string;
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
  farmer?: any | null;
  currentAssociation?: any | null;
}
