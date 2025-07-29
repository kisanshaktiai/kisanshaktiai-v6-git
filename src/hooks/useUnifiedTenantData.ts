import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UnifiedTenantData {
  tenant: any;
  branding: any;
  features: any;
}

interface TenantError {
  code: string;
  message: string;
  details?: any;
}

class TenantDataError extends Error {
  constructor(public code: string, message: string, public details?: any) {
    super(message);
    this.name = 'TenantDataError';
  }
}

/**
 * Optimized tenant data hook that fetches tenant, branding, and features in a single query
 */
export const useUnifiedTenantData = (tenantId?: string) => {
  const queryClient = useQueryClient();

  // Unified query that joins all tenant-related data
  const tenantQuery = useQuery({
    queryKey: ['unified-tenant-data', tenantId],
    queryFn: async (): Promise<UnifiedTenantData> => {
      try {
        if (!tenantId) {
          throw new TenantDataError('MISSING_TENANT_ID', 'Tenant ID is required');
        }

        console.log('🔍 Fetching unified tenant data for:', tenantId);

        // Single query with joins to get all tenant data at once
        const { data, error } = await supabase
          .from('tenants')
          .select(`
            id,
            name,
            slug,
            type,
            status,
            branding_version,
            branding_updated_at,
            created_at,
            updated_at,
            tenant_branding (
              logo_url,
              app_name,
              app_tagline,
              primary_color,
              secondary_color,
              background_color,
              accent_color,
              text_color,
              font_family,
              version,
              updated_at
            ),
            tenant_features (
              ai_chat,
              weather_forecast,
              marketplace,
              community_forum,
              satellite_imagery,
              soil_testing,
              drone_monitoring,
              iot_integration,
              ecommerce,
              payment_gateway,
              inventory_management,
              logistics_tracking,
              basic_analytics,
              advanced_analytics,
              predictive_analytics,
              custom_reports,
              api_access,
              webhook_support,
              third_party_integrations,
              white_label_mobile_app,
              updated_at
            )
          `)
          .eq('id', tenantId)
          .eq('status', 'active')
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            throw new TenantDataError('TENANT_NOT_FOUND', `Tenant with ID ${tenantId} not found`);
          }
          throw new TenantDataError('DATABASE_ERROR', error.message, error);
        }

        if (!data) {
          throw new TenantDataError('NO_DATA', 'No tenant data returned');
        }

        // Transform the joined data into the expected format
        const unifiedData: UnifiedTenantData = {
          tenant: {
            id: data.id,
            name: data.name,
            slug: data.slug,
            type: data.type,
            status: data.status,
            branding_version: data.branding_version,
            branding_updated_at: data.branding_updated_at,
            created_at: data.created_at,
            updated_at: data.updated_at,
          },
          branding: Array.isArray(data.tenant_branding) 
            ? data.tenant_branding[0] || null 
            : data.tenant_branding,
          features: Array.isArray(data.tenant_features) 
            ? data.tenant_features[0] || null 
            : data.tenant_features,
        };

        console.log('✅ Unified tenant data loaded successfully');
        return unifiedData;

      } catch (error) {
        console.error('❌ Failed to fetch unified tenant data:', error);
        
        if (error instanceof TenantDataError) {
          throw error;
        }
        
        throw new TenantDataError(
          'UNKNOWN_ERROR', 
          error instanceof Error ? error.message : 'Unknown error occurred',
          error
        );
      }
    },
    enabled: !!tenantId,
    staleTime: 10 * 60 * 1000, // 10 minutes - tenant data doesn't change often
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    refetchOnWindowFocus: true,
    refetchInterval: 15 * 60 * 1000, // Background refresh every 15 minutes
    retry: (failureCount, error) => {
      // Don't retry for certain error types
      if (error instanceof TenantDataError) {
        if (['TENANT_NOT_FOUND', 'MISSING_TENANT_ID'].includes(error.code)) {
          return false;
        }
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Optimistic mutation for updating tenant branding
  const updateBranding = useMutation({
    mutationFn: async (brandingUpdate: Partial<any>) => {
      if (!tenantId) throw new Error('Tenant ID required');
      
      const { data, error } = await supabase
        .from('tenant_branding')
        .update({
          ...brandingUpdate,
          updated_at: new Date().toISOString(),
        })
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (newBranding) => {
      await queryClient.cancelQueries({ queryKey: ['unified-tenant-data', tenantId] });
      
      const previousData = queryClient.getQueryData(['unified-tenant-data', tenantId]);
      
      queryClient.setQueryData(['unified-tenant-data', tenantId], (old: UnifiedTenantData) => {
        if (!old) return old;
        return {
          ...old,
          branding: {
            ...old.branding,
            ...newBranding,
            updated_at: new Date().toISOString(),
          },
        };
      });

      return { previousData };
    },
    onError: (err, newBranding, context) => {
      queryClient.setQueryData(['unified-tenant-data', tenantId], context?.previousData);
      toast({
        title: "Branding Update Failed",
        description: "Could not update tenant branding. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Branding Updated",
        description: "Tenant branding has been updated successfully.",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-tenant-data', tenantId] });
    },
  });

  // Optimistic mutation for updating tenant features
  const updateFeatures = useMutation({
    mutationFn: async (featuresUpdate: Partial<any>) => {
      if (!tenantId) throw new Error('Tenant ID required');
      
      const { data, error } = await supabase
        .from('tenant_features')
        .update({
          ...featuresUpdate,
          updated_at: new Date().toISOString(),
        })
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (newFeatures) => {
      await queryClient.cancelQueries({ queryKey: ['unified-tenant-data', tenantId] });
      
      const previousData = queryClient.getQueryData(['unified-tenant-data', tenantId]);
      
      queryClient.setQueryData(['unified-tenant-data', tenantId], (old: UnifiedTenantData) => {
        if (!old) return old;
        return {
          ...old,
          features: {
            ...old.features,
            ...newFeatures,
            updated_at: new Date().toISOString(),
          },
        };
      });

      return { previousData };
    },
    onError: (err, newFeatures, context) => {
      queryClient.setQueryData(['unified-tenant-data', tenantId], context?.previousData);
      toast({
        title: "Features Update Failed",
        description: "Could not update tenant features. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Features Updated",
        description: "Tenant features have been updated successfully.",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-tenant-data', tenantId] });
    },
  });

  return {
    // Data
    tenantData: tenantQuery.data,
    tenant: tenantQuery.data?.tenant || null,
    branding: tenantQuery.data?.branding || null,
    features: tenantQuery.data?.features || null,
    
    // States
    isLoading: tenantQuery.isLoading,
    isError: tenantQuery.isError,
    error: tenantQuery.error,
    
    // Actions
    updateBranding: updateBranding.mutate,
    updateFeatures: updateFeatures.mutate,
    isUpdatingBranding: updateBranding.isPending,
    isUpdatingFeatures: updateFeatures.isPending,
    
    // Utilities
    refetch: tenantQuery.refetch,
    invalidate: () => queryClient.invalidateQueries({ queryKey: ['unified-tenant-data', tenantId] }),
  };
};