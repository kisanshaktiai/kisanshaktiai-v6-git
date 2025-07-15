
import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { FarmerProfile } from '@/types/farmer';
import { UserTenant } from '@/types/tenant';

interface AuthContextType {
  user: User | null;
  farmer: FarmerProfile | null;
  currentAssociation: UserTenant | null;
  loading: boolean;
  signIn: (phone: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to safely parse JSON
const safeJsonParse = (value: any, fallback: any = null) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return value;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [farmer, setFarmer] = useState<FarmerProfile | null>(null);
  const [currentAssociation, setCurrentAssociation] = useState<UserTenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        loadUserData(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await loadUserData(session.user);
        } else {
          setUser(null);
          setFarmer(null);
          setCurrentAssociation(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (user: User) => {
    try {
      // Load farmer profile if exists
      const { data: farmerData } = await supabase
        .from('farmers')
        .select('*')
        .eq('id', user.id)
        .single();

      if (farmerData) {
        // Type cast the JSON fields properly
        const farmerProfile: FarmerProfile = {
          ...farmerData,
          verification_documents: safeJsonParse(farmerData.verification_documents, []),
          associated_tenants: Array.isArray(farmerData.associated_tenants)
            ? farmerData.associated_tenants
            : [],
          primary_crops: Array.isArray(farmerData.primary_crops)
            ? farmerData.primary_crops
            : []
        };
        setFarmer(farmerProfile);
      }

      // Load user tenant associations
      const { data: tenantAssociations } = await supabase
        .from('user_tenants')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1);

      if (tenantAssociations && tenantAssociations.length > 0) {
        const association: UserTenant = {
          ...tenantAssociations[0],
          permissions: safeJsonParse(tenantAssociations[0].permissions, [])
        };
        setCurrentAssociation(association);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
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
    localStorage.removeItem('currentTenantId');
  };

  return (
    <AuthContext.Provider value={{
      user,
      farmer,
      currentAssociation,
      loading,
      signIn,
      signOut,
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
