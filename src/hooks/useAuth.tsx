
import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Farmer, FarmerTenantAssociation } from '@/types/database';

interface AuthContextType {
  user: User | null;
  farmer: Farmer | null;
  currentAssociation: FarmerTenantAssociation | null;
  associations: FarmerTenantAssociation[];
  loading: boolean;
  signIn: (phone: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  switchTenant: (tenantId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [currentAssociation, setCurrentAssociation] = useState<FarmerTenantAssociation | null>(null);
  const [associations, setAssociations] = useState<FarmerTenantAssociation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchFarmerData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchFarmerData(session.user.id);
        } else {
          setFarmer(null);
          setAssociations([]);
          setCurrentAssociation(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchFarmerData = async (userId: string) => {
    try {
      // Fetch farmer profile
      const { data: farmerData } = await supabase
        .from('farmers')
        .select('*')
        .eq('id', userId)
        .single();

      setFarmer(farmerData);

      // Fetch tenant associations
      const { data: associationsData } = await supabase
        .from('farmer_tenant_associations')
        .select(`
          *,
          tenant:tenant_id (name, slug, type)
        `)
        .eq('farmer_id', userId)
        .eq('status', 'active');

      setAssociations(associationsData || []);
      
      // Set current association (first active one or from localStorage)
      const savedTenantId = localStorage.getItem('currentTenantId');
      const currentAssoc = associationsData?.find(
        assoc => assoc.tenant_id === savedTenantId
      ) || associationsData?.[0];
      
      setCurrentAssociation(currentAssoc || null);

    } catch (error) {
      console.error('Error fetching farmer data:', error);
    } finally {
      setLoading(false);
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

  const switchTenant = (tenantId: string) => {
    const association = associations.find(assoc => assoc.tenant_id === tenantId);
    if (association) {
      setCurrentAssociation(association);
      localStorage.setItem('currentTenantId', tenantId);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      farmer,
      currentAssociation,
      associations,
      loading,
      signIn,
      signOut,
      switchTenant,
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
