
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FarmerProfile } from '@/types/farmer';

export const useFarmerProfile = (farmerId?: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['farmer-profile', farmerId],
    queryFn: async (): Promise<FarmerProfile | null> => {
      if (!farmerId) return null;

      const { data, error } = await supabase
        .from('farmers')
        .select('*')
        .eq('id', farmerId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!farmerId,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<FarmerProfile>) => {
      if (!farmerId) throw new Error('Farmer ID is required');

      const { data, error } = await supabase
        .from('farmers')
        .update(updates)
        .eq('id', farmerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmer-profile', farmerId] });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (farmerData: Partial<FarmerProfile> & { id: string }) => {
      const { data, error } = await supabase
        .from('farmers')
        .insert([farmerData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmer-profile'] });
    },
  });

  return {
    farmerProfile: query.data,
    loading: query.isLoading,
    error: query.error,
    updateFarmerProfile: updateMutation.mutateAsync,
    createFarmerProfile: createMutation.mutateAsync,
    refetch: query.refetch,
  };
};
