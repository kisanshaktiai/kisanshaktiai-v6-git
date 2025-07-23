
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

      // Type cast JSON fields properly and handle all fields
      return {
        ...data,
        mobile_number: data.mobile_number,
        gender: (data.gender as 'male' | 'female' | 'other') || null,
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
        metadata: safeJsonParse(data.metadata, {}),
        // Handle fields that may not exist in database schema
        mobile_number_verified: data.mobile_number_verified || false,
        email_verified: data.email_verified_at ? true : false,
        last_seen: data.last_seen || null,
        timezone: data.timezone || null,
        preferred_language: data.preferred_language || null
      };
    },
    enabled: !!userId,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      if (!userId) throw new Error('User ID is required');

      // Ensure preferred_language is valid if provided
      const validLanguages = ['en', 'hi', 'mr', 'pa', 'gu', 'te', 'ta', 'kn', 'ml', 'or', 'bn', 'ur', 'ne'];
      if (updates.preferred_language && !validLanguages.includes(updates.preferred_language)) {
        updates.preferred_language = 'hi'; // Default to Hindi
      }

      // Prepare database update object
      const dbUpdate: any = { ...updates };
      
      // Remove TypeScript-only fields that don't exist in database
      delete dbUpdate.id;
      delete dbUpdate.email_verified; // Map to email_verified_at if needed
      
      const { data, error } = await supabase
        .from('user_profiles')
        .update(dbUpdate)
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
      // Ensure preferred_language is valid if provided
      const validLanguages = ['en', 'hi', 'mr', 'pa', 'gu', 'te', 'ta', 'kn', 'ml', 'or', 'bn', 'ur', 'ne'];
      if (profileData.preferred_language && !validLanguages.includes(profileData.preferred_language)) {
        profileData.preferred_language = 'hi'; // Default to Hindi
      }

      // Prepare database insert object
      const dbInsert: any = { ...profileData };
      
      // Remove TypeScript-only fields that don't exist in database
      delete dbInsert.email_verified; // Map to email_verified_at if needed

      const { data, error } = await supabase
        .from('user_profiles')
        .insert(dbInsert)
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
