export interface Profile {
  id: string;
  phone: string;
  full_name?: string;
  display_name?: string;
  village?: string;
  taluka?: string;
  district?: string;
  state?: string;
  pincode?: string;
  avatar_url?: string;
  farmer_id?: string;
  aadhaar_number?: string;
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