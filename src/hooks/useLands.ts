
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Land, LandWithDetails, SoilHealth, CropHistory } from '@/types/land';

export const useLands = () => {
  return useQuery({
    queryKey: ['lands'],
    queryFn: async (): Promise<LandWithDetails[]> => {
      const { data: lands, error } = await supabase
        .from('lands')
        .select(`
          *,
          soil_health:soil_health!soil_health_land_id_fkey(
            id, ph_level, organic_carbon, nitrogen_level, 
            phosphorus_level, potassium_level, soil_type, 
            test_date, source, created_at
          ),
          crop_history!crop_history_land_id_fkey(
            id, crop_name, variety, season, planting_date, 
            harvest_date, yield_kg_per_acre, growth_stage, 
            status, notes, created_at
          ),
          ndvi_data!ndvi_data_land_id_fkey(
            id, date, ndvi_value, satellite_source, 
            image_url, cloud_cover, created_at
          ),
          land_activities!land_activities_land_id_fkey(
            id, activity_type, description, quantity, 
            unit, cost, activity_date, notes, created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process the data to get the most recent related records
      const landsWithDetails: LandWithDetails[] = lands?.map(land => {
        const soilHealth = land.soil_health?.[0] || undefined;
        const currentCrop = land.crop_history?.find(crop => crop.status === 'active') || undefined;
        const recentNdvi = land.ndvi_data?.[0] || undefined;
        const recentActivities = land.land_activities?.slice(0, 5) || [];

        return {
          ...land,
          soil_health: soilHealth,
          current_crop: currentCrop,
          recent_ndvi: recentNdvi,
          recent_activities: recentActivities,
        };
      }) || [];

      return landsWithDetails;
    },
  });
};

export const useCreateLand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (landData: Partial<Land>) => {
      const { data, error } = await supabase
        .from('lands')
        .insert([landData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lands'] });
    },
  });
};

export const useUpdateLand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Land> }) => {
      const { data, error } = await supabase
        .from('lands')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lands'] });
    },
  });
};

export const useDeleteLand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lands')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lands'] });
    },
  });
};

export const useLandHealthScore = (landId: string) => {
  return useQuery({
    queryKey: ['land-health-score', landId],
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase
        .rpc('calculate_land_health_score', { land_uuid: landId });

      if (error) throw error;
      return data || 2.5;
    },
    enabled: !!landId,
  });
};
