
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { supabase } from '@/config/supabase';
import { setAuthenticated, logout } from '@/store/slices/authSlice';

interface AuthContextType {
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  loading: true,
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
  const dispatch = useDispatch();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        } else if (session?.user) {
          console.log('Initial session found:', session.user.id);
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

  return (
    <AuthContext.Provider value={{ loading }}>
      {children}
    </AuthContext.Provider>
  );
};
