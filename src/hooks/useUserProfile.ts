
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/tenant';

export const useUserProfile = (userId?: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!userId,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      if (!userId) throw new Error('User ID is required');

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', userId] });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (profileData: Partial<UserProfile> & { id: string; phone: string }) => {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([profileData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });

  return {
    profile: query.data,
    loading: query.isLoading,
    error: query.error,
    updateProfile: updateMutation.mutateAsync,
    createProfile: createMutation.mutateAsync,
    refetch: query.refetch,
  };
};
