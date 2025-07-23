
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, LanguageCode } from '@/types/tenant';

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

// Helper function to safely cast language code
const castLanguageCode = (lang: string | null | undefined): LanguageCode => {
  if (!lang) return 'en';
  
  const validLanguages: LanguageCode[] = ['en', 'hi', 'mr', 'pa', 'gu', 'te', 'ta', 'kn', 'ml', 'or', 'bn', 'ur', 'ne'];
  
  if (validLanguages.includes(lang as LanguageCode)) {
    return lang as LanguageCode;
  }
  
  return 'en'; // Default fallback
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
        phone: data.mobile_number || '', // Map mobile_number to phone
        preferred_language: castLanguageCode(data.preferred_language), // Safe cast
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

      // Convert phone back to mobile_number for database
      const dbUpdates = {
        ...updates,
        mobile_number: updates.phone, // Map phone to mobile_number
      };
      delete dbUpdates.phone; // Remove phone property

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
    mutationFn: async (profileData: Partial<UserProfile> & { id: string; phone: string }) => {
      // Convert phone to mobile_number for database
      const dbData = {
        ...profileData,
        mobile_number: profileData.phone,
      };
      delete dbData.phone; // Remove phone property

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
