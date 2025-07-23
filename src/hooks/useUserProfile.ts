
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/tenant';

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
      
      if (!data) return null;

      // Type cast JSON fields properly and map mobile_number to phone
      return {
        ...data,
        phone: data.mobile_number || '', // Map mobile_number to phone for compatibility
        notification_preferences: safeJsonParse(data.notification_preferences, {
          sms: true,
          push: true,
          email: false,
          whatsapp: true,
          calls: false
        }),
        device_tokens: safeJsonParse(data.device_tokens, []),
        expertise_areas: Array.isArray(data.expertise_areas)
          ? data.expertise_areas
          : [],
        metadata: safeJsonParse(data.metadata, {})
      };
    },
    enabled: !!userId,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      if (!userId) throw new Error('User ID is required');

      // Map phone back to mobile_number for database storage
      const dbUpdates = {
        ...updates,
        mobile_number: updates.phone || updates.mobile_number
      };
      
      // Remove phone field as it doesn't exist in database
      delete dbUpdates.phone;

      const { data, error } = await supabase
        .from('user_profiles')
        .update(dbUpdates)
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
    mutationFn: async (profileData: Partial<UserProfile> & { id: string; mobile_number: string }) => {
      // Ensure mobile_number is set for database insertion
      const dbData = {
        ...profileData,
        mobile_number: profileData.mobile_number || profileData.phone
      };
      
      // Remove phone field as it doesn't exist in database
      delete dbData.phone;

      const { data, error } = await supabase
        .from('user_profiles')
        .insert([dbData])
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
