
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { secureStorage } from '../services/storage/secureStorage';
import { STORAGE_KEYS } from '../config/constants';
import { syncWithSupabaseAuth } from '../store/slices/authSlice';
import { RootState } from '../store';
import type { Database } from '../integrations/supabase/types';

type Farmer = Database['public']['Tables']['farmers']['Row'];
type UserTenant = Database['public']['Tables']['user_tenants']['Row'];

interface Association {
  id: string;
  tenant_id: string;
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
  const dispatch = useDispatch();
  const reduxAuth = useSelector((state: RootState) => state.auth);
  
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [currentAssociation, setCurrentAssociation] = useState<Association | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          
          // Sync with Redux
          dispatch(syncWithSupabaseAuth({
            isAuthenticated: !!initialSession?.user,
            userId: initialSession?.user?.id
          }));

          if (initialSession?.user) {
            await loadFarmerData(initialSession.user.id);
          }
          
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);

        // Sync with Redux
        dispatch(syncWithSupabaseAuth({
          isAuthenticated: !!session?.user,
          userId: session?.user?.id
        }));

        if (session?.access_token) {
          await secureStorage.set(STORAGE_KEYS.AUTH_TOKEN, session.access_token);
          if (session.user) {
            await loadFarmerData(session.user.id);
          }
        } else {
          await secureStorage.remove(STORAGE_KEYS.AUTH_TOKEN);
          setFarmer(null);
          setCurrentAssociation(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [dispatch]);

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
        
        // Load current association
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

  // Use Redux state for isAuthenticated if available, fallback to local state
  const isAuthenticated = reduxAuth.isAuthenticated || !!user;

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
