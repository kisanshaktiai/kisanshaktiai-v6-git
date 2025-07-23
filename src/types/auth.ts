
// Minimal auth types for compatibility
export interface Profile {
  id: string;
  phone?: string;
  full_name?: string;
}

export interface AuthContextType {
  user: null;
  session: null;
  profile: null;
  loading: boolean;
  isAuthenticated: boolean;
}
