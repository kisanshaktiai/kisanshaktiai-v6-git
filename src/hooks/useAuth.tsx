
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/config/supabase';
import { setAuthenticated, logout } from '@/store/slices/authSlice';
import { RootState } from '@/store';

interface AuthContextType {
  loading: boolean;
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  farmer: any | null;
  currentAssociation: any | null;
}

const AuthContext = createContext<AuthContextType>({
  loading: true,
  user: null,
  session: null,
  isAuthenticated: false,
  farmer: null,
  currentAssociation: null,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const dispatch = useDispatch();
  
  // Get Redux auth state
  const authState = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        } else if (session?.user) {
          console.log('Initial session found:', session.user.id);
          setSession(session);
          setUser(session.user);
          dispatch(setAuthenticated({ 
            userId: session.user.id,
            phoneNumber: session.user.user_metadata?.phone 
          }));
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      setSession(session);
      setUser(session?.user || null);
      
      if (event === 'SIGNED_IN' && session?.user) {
        dispatch(setAuthenticated({ 
          userId: session.user.id,
          phoneNumber: session.user.user_metadata?.phone 
        }));
      } else if (event === 'SIGNED_OUT') {
        dispatch(logout());
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [dispatch]);

  const contextValue: AuthContextType = {
    loading,
    user,
    session,
    isAuthenticated: !!session?.user || authState.isAuthenticated,
    farmer: null, // TODO: Implement farmer profile fetching
    currentAssociation: null, // TODO: Implement association fetching
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
