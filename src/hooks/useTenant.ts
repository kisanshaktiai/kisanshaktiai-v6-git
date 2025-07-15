
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tenant, TenantBranding, TenantFeatures } from '@/types/database';

export const useTenant = (slug?: string) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [features, setFeatures] = useState<TenantFeatures | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTenant = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        
        // Fetch tenant data
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('slug', slug)
          .single();

        if (tenantError) throw tenantError;
        
        setTenant(tenantData);

        // Fetch branding
        const { data: brandingData } = await supabase
          .from('tenant_branding')
          .select('*')
          .eq('tenant_id', tenantData.id)
          .single();

        setBranding(brandingData);

        // Fetch features
        const { data: featuresData } = await supabase
          .from('tenant_features')
          .select('*')
          .eq('tenant_id', tenantData.id)
          .single();

        setFeatures(featuresData);

      } catch (err) {
        console.error('Error fetching tenant:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch tenant');
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
  }, [slug]);

  return { tenant, branding, features, loading, error };
};
