
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { secureStorage } from '../services/storage/secureStorage';
import { STORAGE_KEYS } from '../config/constants';

interface Farmer {
  id: string;
  phone: string;
  // Add other farmer properties as needed
}

interface Association {
  id: string;
  tenant_id: string;
  // Add other association properties as needed
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  farmer: Farmer | null;
  currentAssociation: Association | null;
  signIn: (phone: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [currentAssociation, setCurrentAssociation] = useState<Association | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Load farmer data if user exists
      if (session?.user) {
        loadFarmerData(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (session?.access_token) {
          await secureStorage.set(STORAGE_KEYS.AUTH_TOKEN, session.access_token);
          if (session.user) {
            loadFarmerData(session.user.id);
          }
        } else {
          await secureStorage.remove(STORAGE_KEYS.AUTH_TOKEN);
          setFarmer(null);
          setCurrentAssociation(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadFarmerData = async (userId: string) => {
    try {
      // Load farmer profile
      const { data: farmerData } = await supabase
        .from('farmers')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (farmerData) {
        setFarmer(farmerData);
        
        // Load current association (you may need to adjust this query based on your schema)
        const { data: associationData } = await supabase
          .from('user_tenants')
          .select('*, tenants(*)')
          .eq('user_id', userId)
          .eq('is_active', true)
          .single();
        
        if (associationData) {
          setCurrentAssociation({
            id: associationData.id,
            tenant_id: associationData.tenant_id,
          });
        }
      }
    } catch (error) {
      console.error('Error loading farmer data:', error);
    }
  };

  const signIn = async (phone: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          shouldCreateUser: true,
        },
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    await secureStorage.clear();
    setFarmer(null);
    setCurrentAssociation(null);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      farmer,
      currentAssociation,
      signIn,
      signOut,
      isAuthenticated,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
